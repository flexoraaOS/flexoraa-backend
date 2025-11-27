// Workflow 1: Lead Conversion Bot Controller
// AI-powered conversational agent with Pinecone RAG and Twilio fallback
const geminiService = require('../../services/ai/geminiService');
const memoryService = require('../../services/ai/memoryService');
const pineconeService = require('../../services/ai/pineconeService');
const whatsappService = require('../../services/whatsapp/whatsappService');
const twilioService = require('../../services/twilio/twilioService');
const supabaseService = require('../../services/database/supabaseService');
const logger = require('../../utils/logger');

/**
 * Handle incoming WhatsApp message (Workflow 1)
 */
const handleIncomingMessage = async (req, res) => {
    try {
        const message = whatsappService.parseWebhookMessage(req.body);

        if (!message) {
            return res.status(200).json({ received: true });
        }

        const { from: phoneNumber, text: messageText } = message;
        logger.info({ phoneNumber, messageText }, 'Lead conversion bot: incoming message');

        // Get lead from database
        const lead = await supabaseService.getLeadByPhone(phoneNumber);

        if (!lead) {
            logger.warn({ phoneNumber }, 'Lead not found for phone number');
            return res.status(200).json({ received: true, action: 'lead_not_found' });
        }

        // Get chat history
        const chatHistory = await memoryService.getChatHistory(phoneNumber, 10);

        // Query Pinecone for relevant context (RAG)
        const ragContext = await pineconeService.query([], 3); // Stub: empty vector
        const contextText = ragContext.matches
            .map(m => m.metadata.text)
            .join('\n');

        // Build prompt with context
        const prompt = `You are a helpful sales assistant. Use this context to answer:
${contextText}

Chat history:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${messageText}

Respond naturally and helpfully.`;

        // Generate AI response
        const aiResponse = await geminiService.generateText(prompt, {
            tenantId: lead.tenant_id,
        });

        // Save to chat memory
        await memoryService.addMessage(lead.tenant_id, phoneNumber, 'user', messageText);
        await memoryService.addMessage(lead.tenant_id, phoneNumber, 'assistant', aiResponse.text, aiResponse.tokenCount);

        // Send WhatsApp response
        await whatsappService.sendTextMessage(phoneNumber, aiResponse.text, 'primary');

        // Update lead status
        await supabaseService.updateLead(lead.id, {
            status: 'contacted',
            last_contacted_at: new Date(),
        });

        // Track metrics
        req.app.locals.metrics.workflowExecutions.labels('lead_conversion_bot', 'success').inc();

        res.status(200).json({
            received: true,
            workflow: 'lead_conversion_bot',
            leadId: lead.id,
            aiResponse: aiResponse.text,
        });
    } catch (error) {
        logger.error({ err: error }, 'Lead conversion bot failed');
        req.app.locals.metrics.workflowExecutions.labels('lead_conversion_bot', 'failed').inc();
        throw error;
    }
};

/**
 * Trigger lead conversion campaign manually
 */
const triggerCampaign = async (req, res) => {
    try {
        const { campaignId } = req.body;

        // Get campaign
        const campaign = await supabaseService.getCampaign(campaignId);
        if (!campaign || campaign.status !== 'active') {
            return res.status(400).json({ error: 'Campaign not active' });
        }

        // Get all leads for campaign
        const leads = await supabaseService.getLeads(campaign.user_id, campaignId);

        const results = [];

        for (const lead of leads) {
            try {
                // Generate personalized message
                const prompt = campaign.initial_prompt.replace('{{name}}', campaign.name)
                    .replace('{{description}}', campaign.description);

                const aiMessage = await geminiService.generateText(prompt, {
                    tenantId: campaign.tenant_id,
                });

                // Send WhatsApp message
                await whatsappService.sendTextMessage(lead.phone_number, aiMessage.text, 'primary');

                // If no response or failed, try Twilio fallback
                if (lead.phone_verified && !lead.phone_number.startsWith('+')) {
                    try {
                        await twilioService.makeCall(lead.phone_number, lead.id);
                    } catch (twilioError) {
                        logger.warn({ err: twilioError, leadId: lead.id }, 'Twilio fallback failed');
                    }
                }

                results.push({
                    leadId: lead.id,
                    status: 'sent',
                    message: aiMessage.text,
                });
            } catch (error) {
                logger.error({ err: error, leadId: lead.id }, 'Failed to send to lead');
                results.push({
                    leadId: lead.id,
                    status: 'failed',
                    error: error.message,
                });
            }
        }

        res.json({
            campaignId,
            totalLeads: leads.length,
            results,
        });
    } catch (error) {
        logger.error({ err: error }, 'Campaign trigger failed');
        throw error;
    }
};

module.exports = {
    handleIncomingMessage,
    triggerCampaign,
};

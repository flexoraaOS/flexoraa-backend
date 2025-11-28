// Workflow 4: Chat Responder Controller
// Automated WhatsApp replies with AI and conversation memory
const geminiService = require('../../services/ai/geminiService');
const memoryService = require('../../services/ai/memoryService');
const pineconeService = require('../../services/ai/pineconeService');
const whatsappService = require('../../services/whatsapp/whatsappService');
const supabaseService = require('../../services/database/supabaseService');
const logger = require('../../utils/logger');

/**
 * Handle incoming WhatsApp message (Workflow 4)
 * Auto-responder with AI
 */
const handleMessage = async (req, res) => {
    try {
        const message = whatsappService.parseWebhookMessage(req.body);

        if (!message) {
            return res.status(200).json({ received: true });
        }

        const { from: phoneNumber, text: messageText } = message;
        logger.info({ phoneNumber, messageText }, 'Chat responder: incoming message');

        // Get lead from database
        const lead = await supabaseService.getLeadByPhone(phoneNumber);

        if (!lead) {
            logger.warn({ phoneNumber }, 'Lead not found');
            // Still respond even if lead not found
        }

        // Get campaign info
        const campaign = lead?.campaign_id
            ? await supabaseService.getCampaign(lead.campaign_id)
            : null;

        // Get chat history (buffer window memory)
        const chatHistory = await memoryService.getChatHistory(phoneNumber, 5);

        // Query Pinecone RAG for relevant context
        const ragContext = await pineconeService.query([], 3); // Stub
        const contextText = ragContext.matches
            .map(m => m.metadata.text)
            .join('\n');

        // Build prompt
        const systemPrompt = campaign?.initial_prompt || 'You are a helpful customer service assistant.';
        const prompt = `${systemPrompt}

Context from knowledge base:
${contextText}

Recent conversation:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${messageText}

Create a simple, helpful reply.`;

        // Generate AI response
        const aiResponse = await geminiService.generateText(prompt, {
            tenantId: lead?.tenant_id || '00000000-0000-0000-0000-000000000001'
        });

        // Save to chat memory
        const tenantId = lead?.tenant_id || '00000000-0000-0000-0000-000000000001';
        await memoryService.addMessage(tenantId, phoneNumber, 'user', messageText);
        await memoryService.addMessage(tenantId, phoneNumber, 'assistant', aiResponse.text, aiResponse.tokenCount);

        // Send WhatsApp reply (secondary account)
        await whatsappService.sendTextMessage(phoneNumber, aiResponse.text, 'secondary');

        // Update lead if exists
        if (lead) {
            await supabaseService.updateLead(lead.id, {
                last_contacted_at: new Date()
            });
        }

        // Track metrics
        req.app.locals.metrics.workflowExecutions.labels('chat_responder', 'success').inc();

        res.status(200).json({
            received: true,
            workflow: 'chat_responder',
            leadId: lead?.id,
            aiResponse: aiResponse.text
        });
    } catch (error) {
        logger.error({ err: error }, 'Chat responder failed');
        req.app.locals.metrics.workflowExecutions.labels('chat_responder', 'failed').inc();
        throw error;
    }
};

module.exports = {
    handleMessage
};

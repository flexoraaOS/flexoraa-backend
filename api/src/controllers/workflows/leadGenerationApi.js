// Workflow 3: Lead Generation API Controller
// Webhook endpoint for AI-generated marketing copy
const geminiService = require('../../services/ai/geminiService');
const memoryService = require('../../services/ai/memoryService');
const supabaseService = require('../../services/database/supabaseService');
const logger = require('../../utils/logger');

/**
 * POST /api/webhooks/leados
 * Generate AI marketing copy for leads
 */
const handleLeadGeneration = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id required' });
        }

        logger.info({ userId: user_id }, 'Lead generation API called');

        // Get active campaign for user
        const campaigns = await supabaseService.getActiveCampaigns(user_id);

        if (campaigns.length === 0) {
            return res.status(404).json({ error: 'No active campaigns found' });
        }

        const campaign = campaigns[0]; // Use first active campaign

        // Get all leads for this user/campaign
        const leads = await supabaseService.getLeads(user_id, campaign.id);

        if (leads.length === 0) {
            return res.status(404).json({ error: 'No leads found' });
        }

        const results = [];

        // Generate marketing copy for each lead
        for (const lead of leads) {
            const prompt = `You are a marketing agent for ${campaign.name}. 
Description: ${campaign.description}

Create a single, powerful one-line message that attracts new customers. Focus on the direct benefit. Make it catchy and engaging. Add "Want to learn more?" at the end.

Return ONLY valid JSON in this format:
{
  "phone_number": "${lead.phone_number}",
  "output": "Your generated text here",
  "company": "${campaign.name}"
}`;

            const aiResponse = await geminiService.generateStructured(prompt, {}, {
                tenantId: campaign.tenant_id,
                phoneNumber: lead.phone_number,
                companyName: campaign.name
            });

            // Save to chat memory
            await memoryService.addMessage(
                campaign.tenant_id,
                lead.phone_number,
                'system',
                aiResponse.output,
                null
            );

            results.push(aiResponse);
        }

        // Track metrics
        req.app.locals.metrics.workflowExecutions.labels('lead_generation_api', 'success').inc();

        res.status(200).json({
            workflow: 'lead_generation_api',
            userId: user_id,
            campaignId: campaign.id,
            totalLeads: leads.length,
            results
        });
    } catch (error) {
        logger.error({ err: error }, 'Lead generation API failed');
        req.app.locals.metrics.workflowExecutions.labels('lead_generation_api', 'failed').inc();
        throw error;
    }
};

module.exports = {
    handleLeadGeneration
};

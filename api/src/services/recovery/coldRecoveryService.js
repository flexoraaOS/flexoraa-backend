const db = require('../../config/database');
const logger = require('../../utils/logger');

class ColdRecoveryService {
    /**
     * 24-Hour AI Recovery Workflow for COLD leads (0-30)
     * Token cost: 2.5 tokens per recovery attempt
     */

    async attemptRecovery(leadId) {
        try {
            const lead = await this._getLeadDetails(leadId);

            if (!lead) {
                throw new Error('Lead not found');
            }

            // 1. Generate recovery message
            const recovery Message = await this._generateRecoveryMessage(lead);

            // 2. Send via appropriate channel
            await this._sendRecoveryMessage(lead, recoveryMessage);

            // 3. Update lead status
            await db.query(
                `UPDATE leads 
                 SET ai_recovery_attempted = true,
                     ai_recovery_at = NOW(),
                     status = 'recovery_attempted'
                 WHERE id = $1`,
                [leadId]
            );

            // 4. Schedule follow-up if no response (after 48h)
            await this._scheduleFollowUp(leadId);

            // 5. Deduct tokens
            const tokenService = require('../payment/tokenService');
            await tokenService.deductTokens(
                lead.tenant_id,
                2.5,
                'cold_recovery',
                `Cold lead recovery: ${leadId}`,
                leadId
            );

            logger.info({ leadId, message: recoveryMessage }, 'Cold recovery attempt sent');

            return { success: true, message: recoveryMessage };

        } catch (error) {
            logger.error({ err: error, leadId }, 'Cold recovery failed');
            throw error;
        }
    }

    async _getLeadDetails(leadId) {
        const res = await db.query(
            `SELECT l.*, 
                    (SELECT body FROM messages WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as last_message
             FROM leads l
             WHERE l.id = $1`,
            [leadId]
        );
        return res.rows[0];
    }

    async _generateRecoveryMessage(lead) {
        const chatService = require('../ai/chatService');

        const prompt = `Generate a re-engagement message for a COLD lead who has gone quiet. 
Lead name: ${lead.name || 'there'}
Last message: "${lead.last_message || 'no previous message'}"

Use these strategies:
1. Curiosity: "3 trends affecting your industry right now"
2. Educational: "Here's what we're seeing with similar companies"
3. Soft CTA: "Want me to send relevant insights?"

Keep it friendly, non-pushy, and valuable. Max 2 sentences.`;

        const response = await chatService.generateAIReply({
            userMessage: prompt,
            phoneNumber: lead.phone_number,
            leadContext: { name: lead.name, status: lead.status },
            campaignContext: {}
        });

        return response;
    }

    async _sendRecoveryMessage(lead, message) {
        // Send via WhatsApp (or appropriate channel)
        const whatsappService = require('../whatsapp/whatsappService');

        try {
            await whatsappService.sendMessage(lead.phone_number, message);
        } catch (error) {
            logger.error({ err: error, leadId: lead.id }, 'Failed to send recovery message');
            throw error;
        }
    }

    async _scheduleFollowUp(leadId) {
        // Schedule follow-up check in 48 hours
        await db.query(
            `INSERT INTO scheduled_tasks (task_type, reference_id, scheduled_for, metadata)
             VALUES ('recovery_follow_up', $1, NOW() + INTERVAL '48 hours', $2)`,
            [leadId, JSON.stringify({ attempt: 1 })]
        );
    }
}

module.exports = new ColdRecoveryService();

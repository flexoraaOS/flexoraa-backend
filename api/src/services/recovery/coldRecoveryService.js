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
        const geminiService = require('../ai/geminiService');

        // COLD lead recovery strategy (as per PRD)
        const prompt = `Generate a re-engagement message for a COLD lead (score 0-30) who has gone quiet. 

Lead name: ${lead.name || 'there'}
Last message: "${lead.last_message || 'no previous message'}"
Industry context: ${lead.metadata?.industry || 'general business'}

COLD LEAD STRATEGY (from PRD):
- Re-engagement: "I noticed you viewed our case study—what caught your eye?"
- Curiosity: "3 trends affecting your industry right now"
- Educational: "Here's what we're seeing with similar companies"
- Soft CTA: "Want me to send relevant insights?"

Requirements:
- Friendly, non-pushy tone
- Provide value, not sales pitch
- Create curiosity
- Max 2-3 sentences
- Include soft CTA

Generate the message:`;

        const message = await geminiService.generateText(prompt, { maxTokens: 150, temperature: 0.8 });

        return message.trim();
    }

    async _sendRecoveryMessage(lead, message) {
        // Use session window service for compliance
        const sessionWindowService = require('../whatsapp/sessionWindowService');

        try {
            await sessionWindowService.sendMessage(lead.id, message, {
                templateName: 'cold_recovery'
            });

            // Log recovery attempt
            await db.query(
                `INSERT INTO lead_recovery_log (lead_id, message, sent_at, channel)
                 VALUES ($1, $2, NOW(), 'whatsapp')`,
                [lead.id, message]
            );

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

    /**
     * Process scheduled recovery tasks
     */
    async processScheduledRecoveries() {
        try {
            // Get COLD leads that need recovery (24h after last contact)
            const result = await db.query(
                `SELECT l.id, l.tenant_id, l.score
                 FROM leads l
                 WHERE l.score < 31
                   AND l.status = 'cold'
                   AND l.ai_recovery_attempted = false
                   AND l.last_contacted_at < NOW() - INTERVAL '24 hours'
                   AND l.created_at > NOW() - INTERVAL '7 days'
                 LIMIT 100`
            );

            logger.info({ count: result.rows.length }, 'Processing scheduled cold recoveries');

            for (const lead of result.rows) {
                try {
                    await this.attemptRecovery(lead.id);
                    // Rate limit: 1 per second
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    logger.error({ err: error, leadId: lead.id }, 'Recovery attempt failed');
                }
            }

        } catch (error) {
            logger.error({ err: error }, 'Scheduled recovery processing failed');
        }
    }

    /**
     * Get recovery statistics
     */
    async getRecoveryStats(tenantId, days = 30) {
        const result = await db.query(
            `SELECT 
                COUNT(*) FILTER (WHERE ai_recovery_attempted = true) as attempted,
                COUNT(*) FILTER (WHERE ai_recovery_attempted = true AND status = 'warm') as recovered,
                COUNT(*) FILTER (WHERE ai_recovery_attempted = true AND status = 'converted') as converted
             FROM leads
             WHERE tenant_id = $1 
               AND ai_recovery_at > NOW() - INTERVAL '${days} days'`,
            [tenantId]
        );

        const stats = result.rows[0];
        const recoveryRate = stats.attempted > 0 ? (stats.recovered / stats.attempted * 100).toFixed(1) : 0;
        const conversionRate = stats.attempted > 0 ? (stats.converted / stats.attempted * 100).toFixed(1) : 0;

        return {
            ...stats,
            recoveryRate: parseFloat(recoveryRate),
            conversionRate: parseFloat(conversionRate)
        };
    }
}

module.exports = new ColdRecoveryService();

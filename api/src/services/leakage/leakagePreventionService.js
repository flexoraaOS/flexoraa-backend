const db = require('../../config/database');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class LeakagePreventionService {
    /**
     * Scan for lead leakage every 5-10 minutes
     * Detect: Unreplied SDR messages (>30min), unseen lead messages
     * Action: Re-engage HOT, reassign WARM, escalate COLD
     */
    init() {
        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.scanForLeakage();
        });

        logger.info('Lead leakage prevention scheduler started (every 5 minutes)');
    }

    async scanForLeakage() {
        try {
            logger.debug('Scanning for lead leakage...');

            // 1. Find unreplied SDR messages (>30min)
            const unrepliedRes = await db.query(
                `SELECT l.id, l.assigned_sdr_id, l.score, l.tenant_id, m.created_at as last_message_at
                 FROM leads l
                 JOIN messages m ON m.lead_id = l.id
                 WHERE m.direction = 'inbound'
                   AND m.created_at < NOW() - INTERVAL '30 minutes'
                   AND NOT EXISTS (
                     SELECT 1 FROM messages m2 
                     WHERE m2.lead_id = l.id 
                       AND m2.direction = 'outbound' 
                       AND m2.created_at > m.created_at
                   )
                   AND l.status = 'active'
                 ORDER BY m.created_at DESC`
            );

            logger.info({ count: unrepliedRes.rows.length }, 'Unreplied messages detected');

            for (const lead of unrepliedRes.rows) {
                await this._handleLeakage(lead);
            }

        } catch (error) {
            logger.error({ err: error }, 'Leakage scan failed');
        }
    }

    async _handleLeakage(lead) {
        const { id: leadId, score, assigned_sdr_id, tenant_id } = lead;

        try {
            if (score >= 61) {
                // HOT: AI re-engagement
                logger.warn({ leadId, score }, 'HOT lead leakage detected - AI re-engagement');
                await this._aiReEngage(leadId);
                await this._alertSDR(assigned_sdr_id, leadId, 'urgent');

            } else if (score >= 31) {
                // WARM: Reassign to different SDR
                logger.warn({ leadId, score }, 'WARM lead leakage detected - reassigning');
                await this._reassignLead(leadId, tenant_id);

            } else {
                // COLD: Escalate
                logger.warn({ leadId, score }, 'COLD lead leakage detected - escalating');
                const escalationService = require('../routing/escalationService');
                await escalationService.escalate(leadId, [{ reason: 'leakage_detected', value: 'cold_lead_unreplied' }]);
            }

            // Record leakage event
            await db.query(
                `INSERT INTO lead_leakage_events (lead_id, score, action, detected_at)
                 VALUES ($1, $2, $3, NOW())`,
                [leadId, score, score >= 61 ? 'ai_reengage' : score >= 31 ? 'reassign' : 'escalate']
            );

        } catch (error) {
            logger.error({ err: error, leadId }, 'Failed to handle leakage');
        }
    }

    async _aiReEngage(leadId) {
        // Generate AI follow-up message
        const chatService = require('../ai/chatService');
        const lead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);

        const context = {
            name: lead.rows[0].name,
            status: lead.rows[0].status
        };

        const followUpMessage = await chatService.generateAIReply({
            userMessage: '[System: This is a follow-up for an unreplied lead]',
            phoneNumber: lead.rows[0].phone_number,
            leadContext: context,
            campaignContext: {}
        });

        // Send via WhatsApp (or appropriate channel)
        // TODO: Integrate with whatsappService
        logger.info({ leadId, followUpMessage }, 'AI re-engagement message generated');
    }

    async _reassignLead(leadId, tenantId) {
        const routingService = require('../routing/routingService');
        const lead = await db.query('SELECT score FROM leads WHERE id = $1', [leadId]);
        await routingService.routeLead(leadId, lead.rows[0].score);
    }

    async _alertSDR(sdrId, leadId, priority) {
        // Send urgent notification
        // TODO: SMS/Email/Push
        logger.warn({ sdrId, leadId, priority }, 'SDR alerted about lead leakage');
    }
}

module.exports = new LeakagePreventionService();

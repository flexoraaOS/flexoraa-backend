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
        try {
            const lead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
            const leadData = lead.rows[0];

            // Generate contextual follow-up
            const geminiService = require('../ai/geminiService');
            const psychologyService = require('../ai/psychologyService');

            const psychologyPrompt = psychologyService.getPersuasionStrategy(leadData);
            
            const prompt = `Generate a brief, friendly follow-up message for a lead who hasn't responded.
Lead name: ${leadData.name || 'there'}
Last interaction: They showed interest but haven't replied yet.

${psychologyPrompt}

Keep it under 160 characters, warm and non-pushy.`;

            const followUpMessage = await geminiService.generateText(prompt, { maxTokens: 100 });

            // Send via appropriate channel
            const sessionWindowService = require('../whatsapp/sessionWindowService');
            await sessionWindowService.sendMessage(leadId, followUpMessage);

            // Deduct tokens
            const tokenService = require('../payment/tokenService');
            await tokenService.deductTokens(
                leadData.tenant_id,
                2,
                'ai_reengagement',
                'Leakage prevention re-engagement',
                leadId
            );

            logger.info({ leadId, followUpMessage }, 'AI re-engagement sent');
        } catch (error) {
            logger.error({ err: error, leadId }, 'AI re-engagement failed');
        }
    }

    async _reassignLead(leadId, tenantId) {
        try {
            const routingService = require('../routing/routingService');
            const lead = await db.query('SELECT score, assigned_sdr_id FROM leads WHERE id = $1', [leadId]);
            const oldSDR = lead.rows[0].assigned_sdr_id;
            
            // Route to different SDR
            await routingService.routeLead(leadId, lead.rows[0].score);

            // Log reassignment
            await db.query(
                `INSERT INTO lead_reassignment_log (lead_id, old_sdr_id, reason, reassigned_at)
                 VALUES ($1, $2, 'leakage_prevention', NOW())`,
                [leadId, oldSDR]
            );

            logger.info({ leadId, oldSDR }, 'Lead reassigned due to leakage');
        } catch (error) {
            logger.error({ err: error, leadId }, 'Lead reassignment failed');
        }
    }

    async _alertSDR(sdrId, leadId, priority) {
        try {
            // Get SDR details
            const sdrRes = await db.query(
                'SELECT email, phone_number FROM users WHERE id = $1',
                [sdrId]
            );

            if (sdrRes.rows.length === 0) return;

            const sdr = sdrRes.rows[0];
            const emailService = require('../emailService');

            // Send email alert
            await emailService.sendEmail({
                to: sdr.email,
                subject: `🚨 ${priority.toUpperCase()}: Lead Requires Immediate Attention`,
                html: `
                    <h2>Lead Leakage Alert</h2>
                    <p>A ${priority} priority lead has not received a response for over 30 minutes.</p>
                    <p><strong>Lead ID:</strong> ${leadId}</p>
                    <p><strong>Action Required:</strong> Respond within 10 minutes to prevent reassignment.</p>
                    <p><a href="${process.env.FRONTEND_URL}/dashboard/leads/${leadId}">View Lead</a></p>
                `
            });

            // Create in-app notification
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, priority, reference_id)
                 VALUES ($1, 'lead_leakage', 'Lead Requires Response', 'Unreplied lead for 30+ minutes', $2, $3)`,
                [sdrId, priority, leadId]
            );

            logger.info({ sdrId, leadId, priority }, 'SDR alerted about lead leakage');
        } catch (error) {
            logger.error({ err: error, sdrId, leadId }, 'Failed to alert SDR');
        }
    }

    /**
     * Get leakage statistics for monitoring
     */
    async getLeakageStats(tenantId, days = 7) {
        const result = await db.query(
            `SELECT 
                DATE(detected_at) as date,
                action,
                COUNT(*) as count
             FROM lead_leakage_events lle
             JOIN leads l ON l.id = lle.lead_id
             WHERE l.tenant_id = $1 
               AND lle.detected_at > NOW() - INTERVAL '${days} days'
             GROUP BY DATE(detected_at), action
             ORDER BY date DESC`,
            [tenantId]
        );

        return result.rows;
    }
}

module.exports = new LeakagePreventionService();

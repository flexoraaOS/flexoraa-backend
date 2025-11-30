const db = require('../../config/database');
const logger = require('../../utils/logger');

class EscalationService {
    /**
     * Check if lead should be escalated to human SDR
     * Triggers: AI confidence <0.6, High-ticket ($50K+), urgency keywords, etc.
     */
    async checkEscalation(leadId, context = {}) {
        const {
            aiConfidence,
            budgetEstimate,
            messageText,
            objectionCount
        } = context;

        const triggers = [];

        // 1. AI Confidence check
        if (aiConfidence && aiConfidence < 0.6) {
            triggers.push({ reason: 'low_ai_confidence', value: aiConfidence });
        }

        // 2. High-ticket query
        if (budgetEstimate && budgetEstimate >= 50000) {
            triggers.push({ reason: 'high_ticket', value: budgetEstimate });
        }

        // 3. Urgency/Buying signals
        if (messageText) {
            const urgencyKeywords = ['ready to buy', 'schedule call', 'need immediately', 'asap', 'urgent'];
            const hasUrgency = urgencyKeywords.some(kw => messageText.toLowerCase().includes(kw));
            if (hasUrgency) {
                triggers.push({ reason: 'urgency_detected', value: messageText });
            }

            // 4. Sensitive keywords
            const sensitiveKeywords = ['legal', 'lawyer', 'lawsuit', 'compliance', 'medical', 'doctor', 'financial', 'banking', 'competitor'];
            const hasSensitive = sensitiveKeywords.some(kw => messageText.toLowerCase().includes(kw));
            if (hasSensitive) {
                triggers.push({ reason: 'sensitive_keywords', value: messageText });
            }

            // 5. Competitor mention
            const competitorKeywords = ['competitor', 'alternative', 'vs', 'compare'];
            const hasCompetitor = competitorKeywords.some(kw => messageText.toLowerCase().includes(kw));
            if (hasCompetitor) {
                triggers.push({ reason: 'competitor_mention', value: messageText });
            }
        }

        // 6. Multiple objections
        if (objectionCount && objectionCount >= 3) {
            triggers.push({ reason: 'multiple_objections', value: objectionCount });
        }

        // If any triggers, escalate
        if (triggers.length > 0) {
            await this.escalate(leadId, triggers);
            return true;
        }

        return false;
    }

    async escalate(leadId, triggers) {
        try {
            // 1. Get lead and assign to senior SDR immediately
            const leadRes = await db.query(
                'SELECT * FROM leads WHERE id = $1',
                [leadId]
            );
            const lead = leadRes.rows[0];

            // 2. Find available senior SDR
            const sdrRes = await db.query(
                `SELECT id FROM users 
                 WHERE tenant_id = $1 AND role = 'sdr' AND sdr_level = 'senior' AND is_active = true
                 ORDER BY RANDOM()
                 LIMIT 1`,
                [lead.tenant_id]
            );

            const sdrId = sdrRes.rows[0]?.id;

            // 3. Update lead
            await db.query(
                `UPDATE leads 
                 SET assigned_sdr_id = $1, 
                     escalated = true,
                     escalation_reason = $2,
                     escalated_at = NOW(),
                     routing_priority = 'critical'
                 WHERE id = $3`,
                [sdrId, JSON.stringify(triggers), leadId]
            );

            // 4. Create escalation record
            await db.query(
                `INSERT INTO escalations (lead_id, sdr_id, triggers, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [leadId, sdrId, JSON.stringify(triggers)]
            );

            // 5. Send urgent notification
            logger.warn({ leadId, sdrId, triggers }, 'Lead escalated to senior SDR');

            // TODO: Send SMS/Email/Push notification

            return sdrId;

        } catch (error) {
            logger.error({ err: error, leadId }, 'Escalation failed');
            throw error;
        }
    }
}

module.exports = new EscalationService();

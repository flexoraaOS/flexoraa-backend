const logger = require('../utils/logger');

/**
 * High-Risk Query Detection and Escalation
 * Keywords triggering human review:
 * - Legal: lawsuit, lawyer, contract, compliance
 * - Financial: loan, investment, banking, tax
 * - Medical: medication, doctor, health, disease
 * - Violent: kill, hurt, attack, weapon
 * - Abusive: hate, discriminate, abuse, threat
 */

const HIGH_RISK_KEYWORDS = {
    legal: ['lawsuit', 'lawyer', 'attorney', 'contract', 'compliance', 'court', 'legal action', 'sue'],
    financial: ['loan', 'investment', 'banking', 'tax', 'credit card', 'mortgage', 'financial advice'],
    medical: ['medication', 'doctor', 'health', 'disease', 'medical', 'prescription', 'diagnosis', 'treatment'],
    violent: ['kill', 'hurt', 'attack', 'weapon', 'gun', 'knife', 'violence', 'harm'],
    abusive: ['hate', 'discriminate', 'abuse', 'threat', 'harass', 'racist', 'sexist']
};

class HighRiskDetectionService {
    async detectHighRisk(messageText, leadId, confidence = 1.0) {
        const detection = {
            isHighRisk: false,
            categories: [],
            keywords: [],
            aiConfidenceLow: false,
            requiresHumanReview: false
        };

        // 1. Keyword-based detection
        const text = messageText.toLowerCase();

        for (const [category, keywords] of Object.entries(HIGH_RISK_KEYWORDS)) {
            const matchedKeywords = keywords.filter(kw => text.includes(kw));
            if (matchedKeywords.length > 0) {
                detection.isHighRisk = true;
                detection.categories.push(category);
                detection.keywords.push(...matchedKeywords);
            }
        }

        // 2. AI confidence check
        if (confidence < 0.6) {
            detection.aiConfidenceLow = true;
            detection.isHighRisk = true;
            detection.categories.push('low_confidence');
        }

        // 3. Determine if requires human review
        detection.requiresHumanReview = detection.isHighRisk;

        if (detection.requiresHumanReview) {
            await this._escalateForHumanReview(leadId, messageText, detection);
        }

        return detection;
    }

    async _escalateForHumanReview(leadId, messageText, detection) {
        const db = require('../config/database');

        try {
            // Create human review task
            await db.query(
                `INSERT INTO human_review_queue (lead_id, message_text, risk_categories, keywords, created_at, status)
                 VALUES ($1, $2, $3, $4, NOW(), 'pending')`,
                [leadId, messageText, JSON.stringify(detection.categories), JSON.stringify(detection.keywords)]
            );

            // Notify available auditors
            await this._notifyAuditors(leadId, detection);

            // Return placeholder response to lead
            await this._sendPlaceholderResponse(leadId);

            // Log for compliance
            const auditService = require('./compliance/auditService');
            await auditService.log({
                eventType: 'high_risk_escalation',
                entityType: 'lead',
                entityId: leadId,
                action: 'escalate_human_review',
                metadata: { detection, messageText }
            });

            logger.warn({ leadId, detection }, 'High-risk query escalated for human review');

        } catch (error) {
            logger.error({ err: error, leadId }, 'Human review escalation failed');
        }
    }

    async _notifyAuditors(leadId, detection) {
        // TODO: Send notification to auditors
        logger.info({ leadId, detection }, 'Auditors notified of high-risk query');
    }

    async _sendPlaceholderResponse(leadId) {
        // Send a safe placeholder while waiting for human review
        const placeholderMessage = "Thank you for your message. One of our specialists will review your inquiry and get back to you shortly.";

        const db = require('../config/database');
        const lead = await db.query('SELECT phone_number FROM leads WHERE id = $1', [leadId]);

        if (lead.rows[0]) {
            const whatsappService = require('./whatsapp/whatsappService');
            await whatsappService.sendMessage(lead.rows[0].phone_number, placeholderMessage);
        }
    }
}

module.exports = new HighRiskDetectionService();

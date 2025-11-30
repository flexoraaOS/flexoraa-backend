// WhatsApp 24-Hour Session Window Enforcement
// Ensures compliance with WhatsApp Business Policy
const db = require('../../config/database');
const logger = require('../../utils/logger');
const whatsappService = require('./whatsappService');

class SessionWindowService {
    /**
     * Check if lead is within 24-hour session window
     * @param {string} leadId 
     * @returns {boolean} true if within window, false if expired
     */
    async isWithinSessionWindow(leadId) {
        const result = await db.query(
            `SELECT last_customer_message_at 
             FROM leads 
             WHERE id = $1`,
            [leadId]
        );

        if (result.rows.length === 0) return false;

        const lastMessageAt = result.rows[0].last_customer_message_at;
        if (!lastMessageAt) return false;

        const hoursSinceLastMessage = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceLastMessage < 24;
    }

    /**
     * Send message with automatic session window handling + Meta compliance
     * - Within 24h: Send freeform message
     * - Outside 24h: Use approved template
     */
    async sendMessage(leadId, message, options = {}) {
        try {
            const metaCompliance = require('../meta/metaComplianceService');
            
            // Check Meta compliance first
            const complianceCheck = await metaCompliance.canSendWhatsAppMessage(leadId, 'freeform');

            if (!complianceCheck.allowed) {
                if (complianceCheck.requiresTemplate) {
                    // Outside window - use template
                    logger.info({ leadId, reason: complianceCheck.reason }, 'Using template due to compliance');
                    
                    const lead = await this._getLeadDetails(leadId);
                    const templateName = options.templateName || this._selectTemplate(message);
                    
                    // Check if template is approved
                    const templateCheck = await metaCompliance.isTemplateApproved(templateName, lead.tenant_id);
                    if (!templateCheck.approved) {
                        throw new Error(`Template not approved: ${templateCheck.reason}`);
                    }

                    const templateParams = this._buildTemplateParams(message, lead);

                    return await whatsappService.sendTemplateMessage(
                        lead.phone_number,
                        templateName,
                        templateParams
                    );
                } else {
                    // Other compliance issue (tier limit, quality score, etc.)
                    throw new Error(`Meta compliance check failed: ${complianceCheck.reason}`);
                }
            }

            // Within window - send freeform
            const lead = await this._getLeadDetails(leadId);
            logger.info({ 
                leadId, 
                sessionTimeRemaining: complianceCheck.sessionTimeRemaining 
            }, 'Sending freeform message');

            return await whatsappService.sendTextMessage(lead.phone_number, message);

        } catch (error) {
            logger.error({ err: error, leadId }, 'Session window message send failed');
            throw error;
        }
    }

    /**
     * Update last customer message timestamp
     */
    async updateLastCustomerMessage(leadId) {
        await db.query(
            `UPDATE leads 
             SET last_customer_message_at = NOW() 
             WHERE id = $1`,
            [leadId]
        );
    }

    /**
     * Get leads with expiring sessions (within 1 hour of 24h limit)
     * For proactive engagement before window closes
     */
    async getExpiringSessions(tenantId) {
        const result = await db.query(
            `SELECT id, phone_number, name, last_customer_message_at
             FROM leads
             WHERE tenant_id = $1
               AND last_customer_message_at IS NOT NULL
               AND last_customer_message_at > NOW() - INTERVAL '24 hours'
               AND last_customer_message_at < NOW() - INTERVAL '23 hours'
               AND status NOT IN ('converted', 'lost', 'closed')
             ORDER BY last_customer_message_at ASC`,
            [tenantId]
        );

        return result.rows;
    }

    /**
     * Select appropriate template based on message intent
     */
    _selectTemplate(message) {
        const lowerMessage = message.toLowerCase();

        // Template selection logic
        if (lowerMessage.includes('appointment') || lowerMessage.includes('meeting')) {
            return 'appointment_reminder';
        }
        if (lowerMessage.includes('follow') || lowerMessage.includes('checking')) {
            return 'follow_up';
        }
        if (lowerMessage.includes('offer') || lowerMessage.includes('discount')) {
            return 'promotional_offer';
        }

        // Default template
        return 'general_followup';
    }

    /**
     * Build template parameters from message and lead data
     */
    _buildTemplateParams(message, lead) {
        return {
            language: 'en',
            bodyParameters: [
                { text: lead.name || 'there' },
                { text: message.substring(0, 100) } // Truncate if needed
            ]
        };
    }

    async _getLeadDetails(leadId) {
        const result = await db.query(
            'SELECT * FROM leads WHERE id = $1',
            [leadId]
        );

        if (result.rows.length === 0) {
            throw new Error('Lead not found');
        }

        return result.rows[0];
    }

    /**
     * Get session window statistics for monitoring
     */
    async getSessionStats(tenantId) {
        const result = await db.query(
            `SELECT 
                COUNT(*) FILTER (WHERE last_customer_message_at > NOW() - INTERVAL '24 hours') as active_sessions,
                COUNT(*) FILTER (WHERE last_customer_message_at <= NOW() - INTERVAL '24 hours') as expired_sessions,
                COUNT(*) FILTER (WHERE last_customer_message_at IS NULL) as no_session
             FROM leads
             WHERE tenant_id = $1 AND status NOT IN ('converted', 'lost', 'closed')`,
            [tenantId]
        );

        return result.rows[0];
    }
}

module.exports = new SessionWindowService();

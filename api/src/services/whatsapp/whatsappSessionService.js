const db = require('../../config/database');
const logger = require('../../utils/logger');

class WhatsAppSessionService {
    /**
     * Check and enforce 24-hour session window
     * Within 24h: Can send freeform messages
     * After 24h: Must use approved templates
     */
    async canSendFreeform(phoneNumber) {
        try {
            // Get last inbound message from customer
            const res = await db.query(
                `SELECT created_at FROM messages 
                 WHERE sender_id = $1 
                   AND direction = 'inbound'
                   AND channel = 'whatsapp'
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [phoneNumber]
            );

            if (res.rows.length === 0) {
                // No previous conversation, cannot send freeform
                return { canSend: false, reason: 'no_previous_conversation' };
            }

            const lastMessage = res.rows[0].created_at;
            const hoursSince = (Date.now() - new Date(lastMessage).getTime()) / (1000 * 60 * 60);

            if (hoursSince < 24) {
                return {
                    canSend: true,
                    hoursRemaining: 24 - hoursSince
                };
            } else {
                return {
                    canSend: false,
                    reason: 'session_expired',
                    hoursSince
                };
            }

        } catch (error) {
            logger.error({ err: error, phoneNumber }, 'Session check failed');
            // Fail safe: don't send if uncertain
            return { canSend: false, reason: 'error' };
        }
    }

    async getFallbackTemplate(messageType = 'follow_up') {
        // Get approved WhatsApp template
        const res = await db.query(
            `SELECT template_name, template_content, template_variables 
             FROM whatsapp_templates 
             WHERE template_type = $1 AND is_approved = true
             ORDER BY created_at DESC
             LIMIT 1`,
            [messageType]
        );

        if (res.rows.length === 0) {
            logger.warn({ messageType }, 'No approved template found');
            return null;
        }

        return res.rows[0];
    }

    async validateTemplateCompliance(message) {
        // Ensure message matches approved template structure
        // This is a simplified version - real implementation would be more complex

        const hasVariablePlaceholders = /{{[0-9]+}}/.test(message);
        const hasProhibitedContent = /spam|promotional|discount/i.test(message);

        return {
            isCompliant: hasVariablePlaceholders && !hasProhibitedContent,
            issues: []
        };
    }
}

module.exports = new WhatsAppSessionService();

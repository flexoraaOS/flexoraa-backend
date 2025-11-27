// WhatsApp Business Service (STUB for Phase 1)
// Phase 2: Real WhatsApp Cloud API integration
const logger = require('../../utils/logger');
const config = require('../../config/env');

class WhatsAppService {
    constructor() {
        this.enabled = config.ENABLE_WHATSAPP_SENDING;
        this.accessToken = config.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumbers = {
            primary: config.WHATSAPP_PHONE_NUMBER_ID_PRIMARY,
            support: config.WHATSAPP_PHONE_NUMBER_ID_SUPPORT,
            secondary: config.WHATSAPP_PHONE_NUMBER_ID_SECONDARY,
        };
        this.sandboxMode = config.WHATSAPP_SANDBOX_MODE !== 'false';
        this.approvedTemplates = (config.WHATSAPP_APPROVED_TEMPLATES || '').split(',');
    }

    /**
     * Send text message (STUBBED)
     */
    async sendTextMessage(to, message, phoneNumberId = 'primary') {
        if (!this.enabled) {
            logger.info({ to, message: message.substring(0, 50) }, 'WhatsApp send (stub)');
            return {
                success: true,
                messageId: 'stub_msg_' + Date.now(),
                status: 'sent',
                mode: 'stub',
            };
        }

        // TODO Phase 2: Real API call
        // const response = await axios.post(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        //   messaging_product: 'whatsapp',
        //   to,
        //   text: { body: message },
        // }, {
        //   headers: { Authorization: `Bearer ${this.accessToken}` },
        // });

        return { success: true, messageId: 'stub_msg', mode: 'stub' };
    }

    /**
     * Send template message with parameters (STUBBED)
     */
    async sendTemplateMessage(to, templateName, parameters, phoneNumberId = 'primary') {
        // Template governance check
        if (this.sandboxMode && !this.approvedTemplates.includes(templateName)) {
            logger.warn({ templateName }, 'Template not approved for sandbox sending');
            throw new Error(`Template ${templateName} not approved. Sandbox mode active.`);
        }

        if (!this.enabled) {
            logger.info({ to, templateName }, 'WhatsApp template send (stub)');
            return {
                success: true,
                messageId: 'stub_template_' + Date.now(),
                template: templateName,
                mode: 'stub',
            };
        }

        // TODO Phase 2: Real template send
        return { success: true, messageId: 'stub_template', mode: 'stub' };
    }

    /**
     * Send and wait for response (polling stub)
     */
    async sendAndWait(to, message, timeoutMinutes = 45) {
        const sendResult = await this.sendTextMessage(to, message);

        if (!this.enabled) {
            logger.info({ messageId: sendResult.messageId, timeout: timeoutMinutes }, 'Send and wait (stub)');
            return {
                ...sendResult,
                waitingForResponse: true,
                expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
            };
        }

        // TODO Phase 2: Implement webhook response correlation
        return sendResult;
    }

    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature) {
        // TODO Phase 2: Implement X-Hub-Signature-256 verification
        if (!this.enabled) {
            return true; // Stub mode
        }

        // const crypto = require('crypto');
        // const expectedSignature = crypto
        //   .createHmac('sha256', WEBHOOK_SECRET)
        //   .update(payload)
        //   .digest('hex');
        // return signature === `sha256=${expectedSignature}`;

        return true;
    }

    /**
     * Parse incoming webhook message
     */
    parseWebhookMessage(body) {
        try {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const messages = value?.messages || [];
            const contacts = value?.contacts || [];

            if (messages.length === 0) {
                return null;
            }

            const message = messages[0];
            return {
                from: message.from,
                messageId: message.id,
                timestamp: message.timestamp,
                type: message.type,
                text: message.text?.body || '',
                contact: contacts[0],
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to parse WhatsApp webhook');
            return null;
        }
    }
}

module.exports = new WhatsAppService();

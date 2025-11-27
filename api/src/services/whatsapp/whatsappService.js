// WhatsApp Business Service
// Real implementation using Meta Cloud API (Graph API v17.0+)
const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config/env');
const logger = require('../../utils/logger');

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
        this.apiVersion = 'v17.0';
        this.baseUrl = 'https://graph.facebook.com';
    }

    /**
     * Send text message
     */
    async sendTextMessage(to, message, phoneNumberId = 'primary') {
        const phoneId = this.phoneNumbers[phoneNumberId] || this.phoneNumbers.primary;

        if (!this.enabled || !this.accessToken || !phoneId) {
            logger.info({ to, message: message.substring(0, 50) }, 'WhatsApp send (stub)');
            return {
                success: true,
                messageId: 'stub_msg_' + Date.now(),
                status: 'sent',
                mode: 'stub',
            };
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.apiVersion}/${phoneId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: { body: message },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                success: true,
                messageId: response.data.messages[0].id,
                status: 'sent',
                mode: 'real',
            };
        } catch (error) {
            logger.error({
                err: error.response?.data || error.message,
                to,
                phoneId
            }, 'WhatsApp send failed');
            throw error;
        }
    }

    /**
     * Send template message with parameters
     */
    async sendTemplateMessage(to, templateName, parameters, phoneNumberId = 'primary') {
        const phoneId = this.phoneNumbers[phoneNumberId] || this.phoneNumbers.primary;

        // Template governance check
        if (this.sandboxMode && !this.approvedTemplates.includes(templateName)) {
            logger.warn({ templateName }, 'Template not approved for sandbox sending');
            throw new Error(`Template ${templateName} not approved. Sandbox mode active.`);
        }

        if (!this.enabled || !this.accessToken || !phoneId) {
            logger.info({ to, templateName }, 'WhatsApp template send (stub)');
            return {
                success: true,
                messageId: 'stub_template_' + Date.now(),
                template: templateName,
                mode: 'stub',
            };
        }

        try {
            // Construct components from parameters
            const components = [];

            if (parameters.bodyParameters && parameters.bodyParameters.length > 0) {
                components.push({
                    type: 'body',
                    parameters: parameters.bodyParameters.map(p => ({
                        type: 'text',
                        text: p.text,
                    })),
                });
            }

            if (parameters.buttonParameters && parameters.buttonParameters.length > 0) {
                parameters.buttonParameters.forEach((btn, index) => {
                    if (btn.type === 'url') {
                        components.push({
                            type: 'button',
                            sub_type: 'url',
                            index: index, // Button index (0-based)
                            parameters: [{ type: 'text', text: btn.text }], // Dynamic URL suffix
                        });
                    }
                });
            }

            const response = await axios.post(
                `${this.baseUrl}/${this.apiVersion}/${phoneId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: parameters.language || 'de' },
                        components: components,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                success: true,
                messageId: response.data.messages[0].id,
                mode: 'real',
            };
        } catch (error) {
            logger.error({
                err: error.response?.data || error.message,
                to,
                templateName
            }, 'WhatsApp template send failed');
            throw error;
        }
    }

    /**
     * Verify webhook signature (HMAC SHA256)
     */
    verifySignature(payload, signature) {
        if (!config.WEBHOOK_SECRET) return true; // Skip if no secret configured (dev)

        const expectedSignature = crypto
            .createHmac('sha256', config.WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        // Constant time comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature.replace('sha256=', ''), 'utf8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

        if (signatureBuffer.length !== expectedBuffer.length) return false;
        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
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

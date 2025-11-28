const axios = require('axios');
const crypto = require('crypto');

class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.accessToken2 = process.env.WHATSAPP_ACCESS_TOKEN_2;
        this.verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

        this.client = axios.create({
            baseURL: 'https://graph.facebook.com/v18.0',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    /**
     * Validate webhook verification request from Meta
     */
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.verifyToken) {
            return challenge;
        }
        return null;
    }

    /**
     * Validate webhook signature
     */
    validateSignature(payload, signature) {
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) {
            console.warn('WHATSAPP_APP_SECRET not configured');
            return true; // Skip validation if not configured
        }

        const expectedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');

        return `sha256=${expectedSignature}` === signature;
    }

    /**
     * Check if message is from user (not automated)
     */
    isUserMessage(messageData) {
        if (!messageData.messages || messageData.messages.length === 0) {
            return false;
        }

        const message = messageData.messages[0];

        // Filter out status messages and automated messages
        if (message.type === 'reaction' || message.type === 'system') {
            return false;
        }

        return message.id && message.from;
    }

    /**
     * Extract phone number from various message formats
     */
    extractPhoneNumber(messageData) {
        if (messageData.messages && messageData.messages.length > 0) {
            return messageData.messages[0].from;
        }
        if (messageData.contacts && messageData.contacts.length > 0) {
            return messageData.contacts[0].wa_id || messageData.contacts[0].phone;
        }
        return null;
    }

    /**
     * Send text message
     */
    async sendMessage(phoneNumberId, recipientPhone, message) {
        try {
            const response = await this.client.post(`/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'text',
                text: { body: message }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp send failed:', error.response?.data || error.message);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * Send template message
     */
    async sendTemplate(phoneNumberId, recipientPhone, templateName, components) {
        try {
            const response = await this.client.post(`/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: 'de' },
                    components
                }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp template send failed:', error.response?.data || error.message);
            throw new Error(`Failed to send template: ${error.message}`);
        }
    }
}

module.exports = new WhatsAppService();

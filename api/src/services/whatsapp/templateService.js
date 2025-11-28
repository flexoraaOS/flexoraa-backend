const axios = require('axios');
const logger = require('../../utils/logger');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Send WhatsApp template message
 * Implements n8n "Sending WhatsApp offer template" and "auto-responder template" nodes:
 * - Template name with language code (e.g., "offer_for_manual|de")
 * - Dynamic parameter substitution
 * - Button components with URL parameters
 */
async function sendWhatsAppTemplate({ phoneNumber, template, parameters }) {
    try {
        // Parse template: "offer_for_manual|de" → name + language
        const [templateName, language] = template.split('|');

        const payload = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
                name: templateName,
                language: { code: language || 'en' },
                components: []
            }
        };

        // Add body parameters
        if (parameters.body && parameters.body.length > 0) {
            payload.template.components.push({
                type: 'body',
                parameters: parameters.body.map(text => ({
                    type: 'text',
                    text: String(text)
                }))
            });
        }

        // Add button parameters (URL suffix)
        if (parameters.button) {
            payload.template.components.push({
                type: 'button',
                sub_type: 'url',
                index: 0,
                parameters: [{
                    type: 'text',
                    text: String(parameters.button)
                }]
            });
        }

        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('WhatsApp template sent', { phoneNumber, template, messageId: response.data.messages[0].id });
        return response.data;

    } catch (error) {
        logger.error('WhatsApp template send failed', { error, phoneNumber, template });
        throw error;
    }
}

module.exports = { sendWhatsAppTemplate };

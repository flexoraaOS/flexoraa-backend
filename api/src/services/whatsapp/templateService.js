const axios = require('axios');
const logger = require('../../utils/logger');
const { retryWithBackoff } = require('../../utils/retryWrapper');
const { preValidateTemplate } = require('../../utils/templateValidator');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Send WhatsApp template message (WITH VALIDATION & RETRY)
 * Implements n8n "Sending WhatsApp offer template" and "auto-responder template" nodes
 */
async function sendWhatsAppTemplate({ phoneNumber, template, parameters }) {
    try {
        // PRE-VALIDATE before API call
        preValidateTemplate(template, parameters);

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

        // Send with retry logic
        const response = await retryWithBackoff(
            async () => {
                return await axios.post(
                    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 5000 // 5 second timeout
                    }
                );
            },
            {
                maxRetries: 3,
                onRetry: (attempt, delay, error) => {
                    logger.warn('WhatsApp template send retry', {
                        attempt,
                        delay,
                        error: error.message,
                        template,
                        phoneNumber
                    });
                }
            }
        );

        logger.info('WhatsApp template sent', {
            phoneNumber,
            template,
            messageId: response.data.messages[0].id
        });
        return response.data;

    } catch (error) {
        logger.error('WhatsApp template send failed', {
            error: error.message,
            response: error.response?.data,
            phoneNumber,
            template
        });
        throw error;
    }
}

module.exports = { sendWhatsAppTemplate };

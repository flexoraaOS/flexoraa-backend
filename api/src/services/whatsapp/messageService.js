const axios = require('axios');
const logger = require('../../utils/logger');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage({ to, message }) {
    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('WhatsApp message sent', { to, messageId: response.data.messages[0].id });
        return response.data;

    } catch (error) {
        logger.error('WhatsApp message send failed', { error, to });
        throw error;
    }
}

module.exports = { sendWhatsAppMessage };

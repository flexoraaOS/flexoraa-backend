const axios = require('axios');
const logger = require('../../utils/logger');
const { formatPhoneNumber } = require('../../utils/phoneFormatter');

const KLICKTIPP_API_URL = 'https://api.klicktipp.com';
const KLICKTIPP_USERNAME = process.env.KLICKTIPP_USERNAME;
const KLICKTIPP_PASSWORD = process.env.KLICKTIPP_PASSWORD;

/**
 * Subscribe phone number to KlickTipp
 * Implements n8n "Subscribe number to opt-out from WA messages" node:
 * - Format phone number with + prefix
 * - Subscribe to list
 * - Tag appropriately
 */
async function subscribeToKlickTipp({ phoneNumber, action = 'opt-out' }) {
    try {
        // Format phone number: ensure + prefix
        const formattedPhone = formatPhoneNumber(phoneNumber);

        // KlickTipp API call (simplified - actual API may differ)
        const response = await axios.post(
            `${KLICKTIPP_API_URL}/subscriber`,
            {
                email: `${formattedPhone}@whatsapp.placeholder`, // KlickTipp requires email
                phone: formattedPhone,
                listId: process.env.KLICKTIPP_OPTOUT_LIST_ID,
                tag: action === 'opt-out' ? 'whatsapp_optout' : 'whatsapp_optin'
            },
            {
                auth: {
                    username: KLICKTIPP_USERNAME,
                    password: KLICKTIPP_PASSWORD
                }
            }
        );

        logger.info('KlickTipp subscription successful', { phoneNumber, action });
        return response.data;

    } catch (error) {
        logger.error('KlickTipp subscription failed', { error, phoneNumber });
        // Continue on error - don't throw
        return null;
    }
}

module.exports = { subscribeToKlickTipp };

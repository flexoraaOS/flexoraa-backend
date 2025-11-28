const logger = require('../../utils/logger');
const { formatPhoneNumber } = require('../../utils/phoneFormatter');
const { sendWhatsAppTemplate } = require('../../services/whatsapp/templateService');

/**
 * POST /webhooks/klicktipp
 * Implements n8n Workflow 3 KlickTipp trigger logic:
 * 1. Receive subscriber data from KlickTipp
 * 2. Format phone number
 * 3. Send WhatsApp template with dynamic parameters
 */
exports.handleOutbound = async (req, res) => {
    try {
        const {
            PhoneNumber,
            CustomFieldFirstName,
            CustomField217373, // Product/Service name
            CustomField217511, // Company name
            CustomField218042  // URL ending
        } = req.body;

        logger.info('KlickTipp outbound triggered', { PhoneNumber });

        // Format phone number: 00XX → +XX (matches n8n expression)
        const formattedPhone = formatPhoneNumber(PhoneNumber);

        // Send WhatsApp template (matches "Sending WhatsApp offer template" node)
        await sendWhatsAppTemplate({
            phoneNumber: formattedPhone,
            template: 'offer_for_manual|de',
            parameters: {
                body: [
                    CustomFieldFirstName,
                    CustomField217373,  // Product
                    CustomField217511   // Company
                ],
                button: CustomField218042 // URL suffix
            }
        });

        res.json({ success: true });
        logger.info('WhatsApp template sent', { phoneNumber: formattedPhone });

    } catch (error) {
        logger.error('KlickTipp webhook error', { error });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

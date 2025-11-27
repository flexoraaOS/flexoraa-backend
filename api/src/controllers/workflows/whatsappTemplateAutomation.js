// Workflow 2: WhatsApp/KlickTipp Automation Controller
// Template messages and opt-out handling
const whatsappService = require('../../services/whatsapp/whatsappService');
const klicktippService = require('../../services/klicktipp/klicktippService');
const supabaseService = require('../../services/database/supabaseService');
const logger = require('../../utils/logger');

/**
 * Handle KlickTipp outbound trigger (send template)
 */
const handleKlickTippTrigger = async (req, res) => {
    try {
        const data = klicktippService.parseOutboundWebhook(req.body);
        const { phoneNumber, firstName, customFields } = data;

        logger.info({ phoneNumber, firstName }, 'KlickTipp trigger: sending template');

        // Format phone number (+49 format)
        const formattedPhone = phoneNumber.replace(/^00/, '+');

        // Send WhatsApp template
        const templateName = 'offer_for_manual|de';
        const parameters = {
            bodyParameters: [
                { text: firstName },
                { text: customFields.product },
                { text: customFields.name },
            ],
            buttonParameters: [
                { type: 'url', text: customFields.linkEnding },
            ],
        };

        await whatsappService.sendTemplateMessage(
            formattedPhone,
            templateName,
            parameters,
            'primary'
        );

        // Track metrics
        req.app.locals.metrics.workflowExecutions.labels('whatsapp_template_automation', 'success').inc();

        res.status(200).json({
            received: true,
            workflow: 'whatsapp_template_automation',
            templateSent: templateName,
            phoneNumber: formattedPhone,
        });
    } catch (error) {
        logger.error({ err: error }, 'WhatsApp template automation failed');
        req.app.locals.metrics.workflowExecutions.labels('whatsapp_template_automation', 'failed').inc();
        throw error;
    }
};

/**
 * Handle opt-out (STOP keyword detected)
 */
const handleOptOut = async (req, res) => {
    try {
        const message = whatsappService.parseWebhookMessage(req.body);

        if (!message) {
            return res.status(200).json({ received: true });
        }

        const { from: phoneNumber, contact } = message;
        const contactName = contact?.profile?.name || 'Customer';

        logger.info({ phoneNumber, contactName }, 'Opt-out detected');

        // Record consent opt-out in immutable consent_log
        await supabaseService.recordConsent({
            tenantId: req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
            phoneNumber,
            email: null,
            consentType: 'whatsapp_optin',
            consentStatus: 'revoked',
            consentMethod: 'whatsapp_stop_keyword',
            ipAddress: req.ip,
            rawPayload: req.body,
        });

        // Subscribe to opt-out list in KlickTipp
        await klicktippService.subscribe(null, phoneNumber, 'optout');

        // Tag contact in KlickTipp
        await klicktippService.tagContact('stub_contact', 'whatsapp_optout');

        // Send auto-responder confirmation
        const autoResponderTemplate = 'auto_forward_to_support|de';
        await whatsappService.sendTemplateMessage(
            phoneNumber,
            autoResponderTemplate,
            {
                bodyParameters: [{ text: contactName }],
            },
            'support' // Use support account
        );

        // Track metrics
        req.app.locals.metrics.workflowExecutions.labels('whatsapp_optout', 'success').inc();

        res.status(200).json({
            received: true,
            workflow: 'whatsapp_optout',
            action: 'opted_out',
            phoneNumber,
        });
    } catch (error) {
        logger.error({ err: error }, 'Opt-out handling failed');
        req.app.locals.metrics.workflowExecutions.labels('whatsapp_optout', 'failed').inc();
        throw error;
    }
};

module.exports = {
    handleKlickTippTrigger,
    handleOptOut,
};

// Webhooks Router
// Handles WhatsApp, KlickTipp, and LeadOS webhooks
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyWhatsAppSignature, verifyKlickTippSignature, preventReplay } = require('../middleware/webhookSecurity');
const { verifyAPIKey } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimiter');
const { idempotency } = require('../middleware/idempotency');

// Workflow controllers
const leadConversionBotController = require('../controllers/workflows/leadConversionBot');
const whatsappTemplateController = require('../controllers/workflows/whatsappTemplateAutomation');
const leadGenerationController = require('../controllers/workflows/leadGenerationApi');
const chatResponderController = require('../controllers/workflows/chatResponder');

/**
 * POST /api/webhooks/whatsapp/primary
 * WhatsApp webhook for primary account (Workflows 1, 2)
 */
router.post(
    '/whatsapp/primary',
    webhookLimiter,
    verifyWhatsAppSignature,
    preventReplay,
    asyncHandler(async (req, res) => {
        req.headers['x-webhook-source'] = 'whatsapp-primary';

        // Route to appropriate workflow based on message content
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) {
            return res.status(200).json({ received: true });
        }

        // Check if message starts with "STOP" (Workflow 2: opt-out)
        const messageText = message.text?.body?.toLowerCase().replace(/\s+/g, '') || '';
        if (messageText.startsWith('stop')) {
            await whatsappTemplateController.handleOptOut(req, res);
        } else {
            // Workflow 1: Lead Conversion Bot
            await leadConversionBotController.handleIncomingMessage(req, res);
        }
    })
);

/**
 * POST /api/webhooks/whatsapp/secondary
 * WhatsApp webhook for secondary account (Workflow 4: Chat Responder)
 */
router.post(
    '/whatsapp/secondary',
    webhookLimiter,
    verifyWhatsAppSignature,
    preventReplay,
    asyncHandler(async (req, res) => {
        req.headers['x-webhook-source'] = 'whatsapp-secondary';
        await chatResponderController.handleMessage(req, res);
    })
);

/**
 * POST /api/webhooks/klicktipp
 * KlickTipp outbound webhook (Workflow 2: Template sending)
 */
router.post(
    '/klicktipp',
    webhookLimiter,
    verifyKlickTippSignature,
    preventReplay,
    asyncHandler(async (req, res) => {
        req.headers['x-webhook-source'] = 'klicktipp';
        await whatsappTemplateController.handleKlickTippTrigger(req, res);
    })
);

/**
 * POST /api/webhooks/leados
 * Lead generation API (Workflow 3)
 * Requires JWT or API key authentication
 */
router.post(
    '/leados',
    verifyAPIKey,
    idempotency,
    asyncHandler(async (req, res) => {
        await leadGenerationController.handleLeadGeneration(req, res);
    })
);

/**
 * GET /api/webhooks/whatsapp/verify
 * WhatsApp webhook verification
 */
router.get('/whatsapp/verify', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

module.exports = router;

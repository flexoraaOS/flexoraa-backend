const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const validateIdempotency = require('../middleware/idempotency');
const { validateNonEmptyBody } = require('../middleware/validatePayload');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Import controllers
const leadosController = require('../controllers/webhooks/leadosController');
const whatsappController = require('../controllers/webhooks/whatsappController');
const klicktippController = require('../controllers/webhooks/klicktippController');

/**
 * POST /webhooks/leados
 * Webhook endpoint matching n8n workflow 1
 * Triggers lead generation + AI marketing flow
 */
router.post('/leados',
    verifyJWT,
    validateNonEmptyBody,  // Reject empty payloads
    validateIdempotency,
    leadosController.handleLeados
);

/**
 * GET /webhooks/whatsapp (Meta challenge)
 * POST /webhooks/whatsapp (Incoming messages)
 * WhatsApp Cloud API webhook
 */
router.get('/whatsapp', whatsappController.handleChallenge);
router.post('/whatsapp',
    whatsappController.validateSignature,
    whatsappController.handleMessage
);

/**
 * POST /webhooks/klicktipp
 * KlickTipp outbound trigger
 * Sends WhatsApp templates
 */
router.post('/klicktipp', klicktippController.handleOutbound);

/**
 * GET/POST /webhooks/instagram
 * Instagram Messaging Webhooks
 */
router.get('/instagram', whatsappController.handleChallenge); // Reusing challenge logic as it's same for all Meta apps
router.post('/instagram',
    whatsappController.validateSignature, // Reusing signature validation
    async (req, res) => {
        // TODO: Extract this to a controller
        const unifiedInboxService = require('../services/unifiedInboxService');
        try {
            const entry = req.body.entry?.[0];
            const messaging = entry?.messaging?.[0];

            if (messaging) {
                await unifiedInboxService.processIncomingMessage({
                    channel: 'instagram',
                    externalId: messaging.message?.mid,
                    senderId: messaging.sender?.id,
                    senderName: 'Instagram User', // Graph API requires separate call to get name
                    content: {
                        type: 'text',
                        body: messaging.message?.text
                    },
                    metadata: messaging,
                    tenantId: req.user?.tenant_id || 'default' // Webhooks don't have req.user, need tenant resolution strategy
                });
            }
            res.sendStatus(200);
        } catch (error) {
            logger.error({ err: error }, 'Instagram Webhook Error');
            res.sendStatus(500);
        }
    }
);

/**
 * GET/POST /webhooks/facebook
 * Facebook Messenger Webhooks
 */
router.get('/facebook', whatsappController.handleChallenge);
router.post('/facebook',
    whatsappController.validateSignature,
    async (req, res) => {
        const unifiedInboxService = require('../services/unifiedInboxService');
        try {
            const entry = req.body.entry?.[0];
            const messaging = entry?.messaging?.[0];

            if (messaging) {
                await unifiedInboxService.processIncomingMessage({
                    channel: 'facebook',
                    externalId: messaging.message?.mid,
                    senderId: messaging.sender?.id,
                    senderName: 'Facebook User',
                    content: {
                        type: 'text',
                        body: messaging.message?.text
                    },
                    metadata: messaging,
                    tenantId: 'default'
                });
            }
            res.sendStatus(200);
        } catch (error) {
            logger.error({ err: error }, 'Facebook Webhook Error');
            res.sendStatus(500);
        }
    }
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const validateIdempotency = require('../middleware/idempotency');
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

module.exports = router;

// Webhook Signature Verification Middleware
// Prevents replay attacks with nonce storage
const crypto = require('crypto');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Verify WhatsApp webhook signature
 */
const verifyWhatsAppSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];

    if (!signature) {
        logger.warn('WhatsApp webhook: missing signature');
        return res.status(401).json({ error: 'No signature provided' });
    }

    // TODO Phase 2: Real signature verification
    // const expectedSignature = crypto
    //   .createHmac('sha256', WEBHOOK_SECRET)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');

    // if (signature !== `sha256=${expectedSignature}`) {
    //   logger.warn({ signature }, 'WhatsApp webhook: invalid signature');
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Phase 1: Stub mode - always pass
    logger.debug('WhatsApp signature verified (stub mode)');
    next();
};

/**
 * Prevent replay attacks with nonce checking
 */
const preventReplay = async (req, res, next) => {
    try {
        const requestId = req.headers['x-request-id'];
        const nonce = req.headers['x-nonce'];

        if (!requestId) {
            return res.status(400).json({ error: 'X-Request-Id header required' });
        }

        // Check if request_id or nonce already exists
        const result = await db.query(
            `SELECT check_duplicate_webhook_request($1, $2)`,
            [requestId, nonce]
        );

        if (result.rows[0].check_duplicate_webhook_request) {
            logger.warn({ requestId, nonce }, 'Duplicate webhook request detected');
            return res.status(409).json({ error: 'Duplicate request' });
        }

        // Store request in webhook_raw table
        const source = req.headers['x-webhook-source'] || 'unknown';
        await db.query(
            `INSERT INTO webhook_raw (source, request_id, nonce, headers, body, raw_body, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                source,
                requestId,
                nonce,
                JSON.stringify(req.headers),
                JSON.stringify(req.body),
                JSON.stringify(req.body),
                req.ip,
            ]
        );

        next();
    } catch (error) {
        logger.error({ err: error }, 'Replay prevention check failed');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Verify KlickTipp signature
 */
const verifyKlickTippSignature = (req, res, next) => {
    // TODO Phase 2: Implement KlickTipp signature verification
    logger.debug('KlickTipp signature verified (stub mode)');
    next();
};

module.exports = {
    verifyWhatsAppSignature,
    verifyKlickTippSignature,
    preventReplay,
};

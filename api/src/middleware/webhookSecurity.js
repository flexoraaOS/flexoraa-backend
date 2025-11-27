// Webhook Security Middleware
// Prevents replay attacks using Redis-backed nonce storage
const { redis } = require('./rateLimiter');
const logger = require('../utils/logger');

const NONCE_TTL = 15 * 60; // 15 minutes in seconds

/**
 * Prevent Replay Attacks
 * Checks for unique request ID or signature in Redis
 */
const preventReplay = async (req, res, next) => {
    // Identify unique request identifier
    // Priority: X-Hub-Signature (WhatsApp/FB) > X-Request-ID > X-Twilio-Signature
    const nonce = req.headers['x-hub-signature'] ||
        req.headers['x-request-id'] ||
        req.headers['x-twilio-signature'];

    if (!nonce) {
        // If no unique ID is present, we can't prevent replay effectively without inspecting body
        // For strict security, we might reject, but for now we log warning and proceed 
        // (or generate a hash of the body if available)
        logger.warn({ ip: req.ip, path: req.path }, 'Webhook missing unique signature/ID for replay protection');
        return next();
    }

    const redisKey = `nonce:${nonce}`;

    try {
        // Check if nonce exists
        const exists = await redis.get(redisKey);

        if (exists) {
            logger.warn({ ip: req.ip, nonce }, 'Replay attack detected');
            return res.status(409).json({ error: 'Duplicate request detected' });
        }

        // Store nonce with TTL
        await redis.set(redisKey, '1', 'EX', NONCE_TTL);
        next();
    } catch (error) {
        logger.error({ err: error }, 'Redis error in replay prevention');
        // Fail open or closed? 
        // Fail open (allow request) to prevent DoS if Redis is down, but log error.
        // For high security, fail closed (next(error)).
        // We'll fail open for availability but log critical error.
        next();
    }
};

module.exports = {
    preventReplay
};

// Idempotency Middleware
// Tracks X-Request-Id to prevent duplicate processing
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Check for duplicate requests via X-Request-Id header
 */
const idempotency = async (req, res, next) => {
    const requestId = req.headers['x-request-id'];

    if (!requestId) {
        // X-Request-Id is required for idempotent endpoints
        return res.status(400).json({
            error: 'X-Request-Id header required for idempotent operations'
        });
    }

    try {
        // Check if request already processed
        const result = await db.query(
            `SELECT processed, body FROM webhook_raw WHERE request_id = $1`,
            [requestId]
        );

        if (result.rows.length > 0 && result.rows[0].processed) {
            // Request already processed - return cached response
            logger.info({ requestId }, 'Idempotent request: returning cached response');

            return res.status(200).json({
                ...result.rows[0].body,
                _idempotent: true,
                _cached: true,
            });
        }

        // New request - continue
        req.requestId = requestId;
        next();
    } catch (error) {
        logger.error({ err: error, requestId }, 'Idempotency check failed');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Mark request as processed (called after successful response)
 */
const markProcessed = async (requestId, responseBody) => {
    try {
        await db.query(
            `UPDATE webhook_raw 
       SET processed = true, processed_at = NOW(), body = $2
       WHERE request_id = $1`,
            [requestId, JSON.stringify(responseBody)]
        );

        logger.debug({ requestId }, 'Request marked as processed');
    } catch (error) {
        logger.error({ err: error, requestId }, 'Failed to mark request as processed');
    }
};

module.exports = {
    idempotency,
    markProcessed,
};

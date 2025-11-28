/**
 * Validation Middleware - Reject Empty Payloads
 * Ensures webhook endpoints cannot accept empty JSON bodies
 */

const logger = require('../utils/logger');

/**
 * Validates that the request body is not empty
 */
function validateNonEmptyBody(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('Empty payload rejected', {
            path: req.path,
            method: req.method,
            headers: req.headers
        });
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Request body cannot be empty'
        });
    }
    next();
}

module.exports = {
    validateNonEmptyBody
};

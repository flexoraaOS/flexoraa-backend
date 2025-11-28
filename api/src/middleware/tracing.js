/**
 * Request Tracing Middleware
 * 
 * FIXES: CRITICAL #8 - No request tracing makes debugging impossible
 * 
 * Features:
 * - Generates unique trace ID for each request
 * - Propagates trace ID through all logs
 * - Attaches trace ID to response header
 * - Enables end-to-end request tracking
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request tracing middleware
 * Injects trace ID into request object and response headers
 */
function tracingMiddleware(req, res, next) {
    // Use existing trace ID from header, or generate new one
    req.id = req.headers['x-request-id'] ||
        req.headers['x-trace-id'] ||
        uuidv4();

    // Attach trace ID to response header
    res.setHeader('X-Request-ID', req.id);
    res.setHeader('X-Trace-ID', req.id);

    // Store start time for latency tracking
    req.startTime = Date.now();

    // Log incoming request
    logger.info('Incoming request', {
        traceId: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Intercept response to log completion
    const originalJson = res.json;
    res.json = function (body) {
        const duration = Date.now() - req.startTime;

        logger.info('Request completed', {
            traceId: req.id,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration
        });

        return originalJson.call(this, body);
    };

    next();
}

/**
 * Get trace context for current request
 * Use this in services to attach trace ID to logs
 */
function getTraceContext(req) {
    return {
        traceId: req.id,
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
    };
}

module.exports = {
    tracingMiddleware,
    getTraceContext
};

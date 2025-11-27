// Error Handler Middleware
const logger = require('../utils/logger');

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        err,
        method: req.method,
        path: req.path,
        body: req.body,
        user: req.user?.id,
    }, 'Request error');

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Send response
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
};

/**
 * Async route wrapper (catches promise rejections)
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware - ENHANCED
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:']
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
}));

// CORS
app.use(cors());

// Body parsing with SIZE LIMITS (PR #19)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request tracing middleware (PR #18)
const { tracingMiddleware } = require('./middleware/tracing');
app.use(tracingMiddleware);

// Rate limiting (PR #17)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Stricter limit for auth endpoints
    skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Import routes
const leadsRoutes = require('./routes/leads');
const webhooksRoutes = require('./routes/webhooks');
const authRoutes = require('./routes/auth');

// Register routes
app.use('/api/leads', leadsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check with circuit breaker status
app.get('/health', async (req, res) => {
    const { getCircuitBreakerHealth } = require('./utils/circuitBreaker');
    const { openaiBreaker } = require('./services/ai/marketingService');

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        circuitBreakers: {
            openai: getCircuitBreakerHealth(openaiBreaker)
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    const logger = require('./utils/logger');

    logger.error('Unhandled error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        traceId: req.id
    });

    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal server error'
            : err.message
    });
});

const PORT = process.env.PORT || 3000;
let server;

if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} else {
    // Export app for testing
    module.exports = app;
}

// GRACEFUL SHUTDOWN (PR #22)
const logger = require('./utils/logger');
const db = require('./config/database');

async function gracefulShutdown(signal) {
    logger.info(`${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Close database pool
            await db.end();
            logger.info('Database connections closed');

            // Close Redis (if imported)
            try {
                const Redis = require('ioredis');
                const redis = new Redis(process.env.REDIS_URL);
                await redis.quit();
                logger.info('Redis connection closed');
            } catch (e) {
                // Redis may not be used in all contexts
            }

            logger.info('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
            process.exit(1);
        }
    });

    // Force exit after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after 30s timeout');
        process.exit(1);
    }, 30000);
}

// Graceful shutdown listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', {
        error: err.message,
        stack: err.stack
    });
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', {
        reason,
        promise
    });
});

module.exports = app;

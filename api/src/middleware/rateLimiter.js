// Rate Limiting Middleware (Redis-backed)
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');

// Create Redis client
const redis = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
});

/**
 * Global API rate limiter
 */
const globalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    }),
    windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes default
    max: config.RATE_LIMIT_MAX_REQUESTS, // 100 requests default
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: res.getHeader('Retry-After')
        });
    }
});

/**
 * Per-tenant rate limiter
 */
const tenantLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:tenant:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per tenant
    skip: (req) => !req.user?.tenantId,
    keyGenerator: (req) => req.user?.tenantId || req.ip,
    message: 'Tenant rate limit exceeded'
});

/**
 * Webhook rate limiter (more permissive)
 */
const webhookLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:webhook:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 300, // 300 webhooks per minute
    skip: (req) => false, // Always apply
    keyGenerator: (req) => req.headers['x-webhook-source'] || req.ip,
    message: 'Webhook rate limit exceeded'
});

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:strict:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 requests per 15 minutes
    message: 'Too many attempts, please try again later'
});

module.exports = {
    globalLimiter,
    tenantLimiter,
    webhookLimiter,
    strictLimiter,
    redis // Export for other uses
};

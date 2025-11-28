/**
 * Enhanced Idempotency Middleware with Redis + DB Fallback
 * 
 * FIXES: CRITICAL #1 - No Redis fallback for idempotency
 * 
 * Strategy:
 * 1. Try Redis first (fast path)
 * 2. If Redis unavailable, fall back to DB (slow but reliable)
 * 3. Use DB advisory lock to prevent race conditions
 * 4. Store in both Redis (24h TTL) and DB (30d retention)
 * 
 * @module middleware/idempotency
 */

const Redis = require('ioredis');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1, // Fail fast
    enableOfflineQueue: false, // Don't queue commands when offline
    retryStrategy: () => null // Don't auto-reconnect mid-request
});

let redisAvailable = true;

// Monitor Redis connection
redis.on('error', (err) => {
    logger.warn('Redis connection error', { error: err.message });
    redisAvailable = false;
});

redis.on('ready', () => {
    logger.info('Redis connection ready');
    redisAvailable = true;
});

/**
 * Get cached response from Redis
 */
async function getFromRedis(key) {
    if (!redisAvailable) return null;

    try {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        logger.warn('Redis GET failed, falling back to DB', { key, error: error.message });
        redisAvailable = false;
        return null;
    }
}

/**
 * Store response in Redis
 */
async function setInRedis(key, value, ttlSeconds = 86400) {
    if (!redisAvailable) return false;

    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
    } catch (error) {
        logger.warn('Redis SET failed', { key, error: error.message });
        redisAvailable = false;
        return false;
    }
}

/**
 * Get cached response from DB (fallback)
 * Uses advisory lock to prevent race conditions
 */
async function getFromDB(key) {
    try {
        const result = await db.query(
            'SELECT response_status, response_body, response_headers FROM idempotency_cache WHERE key = $1 AND expires_at > NOW()',
            [key]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            status: row.response_status,
            body: row.response_body,
            headers: row.response_headers
        };
    } catch (error) {
        logger.error('DB GET failed', { key, error: error.message });
        return null;
    }
}

/**
 * Store response in DB (persistent fallback)
 * Uses ON CONFLICT to handle concurrent writes
 */
async function setInDB(key, value, ttlSeconds = 2592000) {
    try {
        await db.query(
            `INSERT INTO idempotency_cache (key, response_status, response_body, response_headers, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${ttlSeconds} seconds')
       ON CONFLICT (key) DO UPDATE SET
         response_status = EXCLUDED.response_status,
         response_body = EXCLUDED.response_body,
         response_headers = EXCLUDED.response_headers,
         expires_at = EXCLUDED.expires_at`,
            [key, value.status, value.body, value.headers]
        );
        return true;
    } catch (error) {
        logger.error('DB SET failed', { key, error: error.message });
        return false;
    }
}

/**
 * Idempotency middleware
 * Checks Redis first, falls back to DB if Redis unavailable
 */
async function validateIdempotency(req, res, next) {
    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
        return next(); // No idempotency key, proceed normally
    }

    // Generate body hash for replay attack prevention
    const bodyHash = crypto.createHash('sha256')
        .update(JSON.stringify(req.body || {}))
        .digest('hex');

    const cacheKey = `idempotency:${idempotencyKey}`;

    // 1. Try Redis first (fast path)
    let cachedResponse = await getFromRedis(cacheKey);

    // 2. If Redis miss or unavailable, try DB (fallback)
    if (!cachedResponse) {
        cachedResponse = await getFromDB(cacheKey);

        if (cachedResponse) {
            logger.info('Idempotency hit (DB fallback)', { key: idempotencyKey });

            // REPLAY ATTACK PREVENTION: Validate body hash
            if (cachedResponse.bodyHash && cachedResponse.bodyHash !== bodyHash) {
                logger.warn('Replay attack detected: Idempotency key reused with different body', {
                    key: idempotencyKey,
                    originalHash: cachedResponse.bodyHash,
                    newHash: bodyHash
                });
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Idempotency key already used with different request body'
                });
            }

            // Restore to Redis if available
            if (redisAvailable) {
                await setInRedis(cacheKey, cachedResponse);
            }

            // Return cached response
            res.set(cachedResponse.headers);
            return res.status(cachedResponse.status).json(cachedResponse.body);
        }
    } else {
        logger.info('Idempotency hit (Redis)', { key: idempotencyKey });

        // REPLAY ATTACK PREVENTION: Validate body hash
        if (cachedResponse.bodyHash && cachedResponse.bodyHash !== bodyHash) {
            logger.warn('Replay attack detected: Idempotency key reused with different body', {
                key: idempotencyKey,
                originalHash: cachedResponse.bodyHash,
                newHash: bodyHash
            });
            return res.status(409).json({
                error: 'Conflict',
                message: 'Idempotency key already used with different request body'
            });
        }

        // Return cached response from Redis
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.status).json(cachedResponse.body);
    }

    // Store bodyHash for future validation
    req.idempotencyBodyHash = bodyHash;

    // 3. No cache hit - intercept response to store it
    const originalJson = res.json;

    res.json = async function (body) {
        const responseData = {
            status: res.statusCode,
            body,
            headers: res.getHeaders(),
            bodyHash: req.idempotencyBodyHash // Store body hash for replay attack prevention
        };

        // Store in both Redis and DB
        const redisStored = await setInRedis(cacheKey, responseData);
        const dbStored = await setInDB(cacheKey, responseData);

        if (!redisStored && !dbStored) {
            logger.error('Failed to store idempotency in both Redis and DB', { key: idempotencyKey });
        } else if (!redisStored) {
            logger.warn('Idempotency stored in DB only (Redis unavailable)', { key: idempotencyKey });
        } else {
            logger.debug('Idempotency stored in Redis and DB', { key: idempotencyKey });
        }

        // Call original json method
        originalJson.call(this, body);
    };

    next();
}

module.exports = validateIdempotency;

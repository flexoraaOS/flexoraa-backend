const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Distributed Lock Manager using Redis
 * Prevents race conditions in concurrent webhook processing
 */

/**
 * Acquire a distributed lock
 * @param {string} key - Lock key
 * @param {number} ttlSeconds - Lock TTL in seconds
 * @returns {Promise<boolean>} True if lock acquired
 */
async function acquireLock(key, ttlSeconds = 30) {
    try {
        // SET key value NX EX ttl
        // NX = only set if not exists
        // EX = set expiry
        const result = await redis.set(
            `lock:${key}`,
            Date.now(),
            'NX',
            'EX',
            ttlSeconds
        );

        return result === 'OK';
    } catch (error) {
        logger.error('Failed to acquire lock', { key, error });
        return false;
    }
}

/**
 * Release a distributed lock
 * @param {string} key - Lock key
 */
async function releaseLock(key) {
    try {
        await redis.del(`lock:${key}`);
    } catch (error) {
        logger.error('Failed to release lock', { key, error });
    }
}

/**
 * Execute function with distributed lock
 * @param {string} lockKey - Lock key
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options
 * @returns {Promise} Result of function
 */
async function withLock(lockKey, fn, options = {}) {
    const {
        ttlSeconds = 30,
        maxWaitSeconds = 10,
        retryIntervalMs = 100
    } = options;

    const startTime = Date.now();
    let acquired = false;

    // Try to acquire lock
    while (!acquired && (Date.now() - startTime) < (maxWaitSeconds * 1000)) {
        acquired = await acquireLock(lockKey, ttlSeconds);

        if (!acquired) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        }
    }

    if (!acquired) {
        throw new Error(`Failed to acquire lock: ${lockKey}`);
    }

    try {
        // Execute function with lock held
        return await fn();
    } finally {
        // Always release lock
        await releaseLock(lockKey);
    }
}

module.exports = {
    acquireLock,
    releaseLock,
    withLock
};

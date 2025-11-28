/**
 * Distributed Lock Manager
 * Provides Redis-based distributed locking to prevent race conditions
 * in concurrent webhook processing and critical sections
 * 
 * @module utils/distributedLock
 */

const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Acquire a distributed lock with automatic expiration
 * 
 * @param {string} key - Unique lock identifier
 * @param {number} [ttlSeconds=30] - Time-to-live in seconds (prevents deadlocks)
 * @returns {Promise<boolean>} True if lock was successfully acquired, false otherwise
 * 
 * @example
 * const acquired = await acquireLock('webhook:user123', 30);
 * if (acquired) {
 *   // Critical section
 * }
 */
async function acquireLock(key, ttlSeconds = 30) {
    if (!key || typeof key !== 'string') {
        throw new Error('Lock key must be a non-empty string');
    }

    try {
        // SET key value NX EX ttl
        // NX = only set if not exists (atomic check-and-set)
        // EX = set expiry (prevents deadlocks if process crashes)
        const result = await redis.set(
            `lock:${key}`,
            Date.now(),
            'NX',
            'EX',
            ttlSeconds
        );

        return result === 'OK';
    } catch (error) {
        logger.error('Failed to acquire lock', { key, error: error.message });
        return false;
    }
}

/**
 * Release a distributed lock
 * 
 * @param {string} key - Lock identifier to release
 * @returns {Promise<void>}
 * 
 * @example
 * await releaseLock('webhook:user123');
 */
async function releaseLock(key) {
    if (!key || typeof key !== 'string') {
        throw new Error('Lock key must be a non-empty string');
    }

    try {
        await redis.del(`lock:${key}`);
    } catch (error) {
        logger.error('Failed to release lock', { key, error: error.message });
    }
}

/**
 * Execute a function with distributed lock protection
 * Automatically acquires lock before execution and releases it after
 * 
 * @param {string} lockKey - Unique lock identifier
 * @param {Function} fn - Async function to execute with lock held
 * @param {Object} [options={}] - Lock configuration
 * @param {number} [options.ttlSeconds=30] - Lock expiration time
 * @param {number} [options.maxWaitSeconds=10] - Maximum time to wait for lock
 * @param {number} [options.retryIntervalMs=100] - Time between lock acquisition retries
 * @returns {Promise<*>} Result of the executed function
 * @throws {Error} If lock cannot be acquired within maxWaitSeconds
 * 
 * @example
 * const result = await withLock('process:invoice123', async () => {
 *   // This code runs with exclusive lock
 *   return await processInvoice();
 * });
 */
async function withLock(lockKey, fn, options = {}) {
    if (!lockKey || typeof lockKey !== 'string') {
        throw new Error('Lock key must be a non-empty string');
    }

    if (typeof fn !== 'function') {
        throw new Error('fn must be a function');
    }

    const {
        ttlSeconds = 30,
        maxWaitSeconds = 10,
        retryIntervalMs = 100
    } = options;

    const startTime = Date.now();
    let acquired = false;

    // Try to acquire lock with retries
    while (!acquired && (Date.now() - startTime) < (maxWaitSeconds * 1000)) {
        acquired = await acquireLock(lockKey, ttlSeconds);

        if (!acquired) {
            // Wait before retrying to avoid spinning
            await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        }
    }

    if (!acquired) {
        throw new Error(`Failed to acquire lock: ${lockKey} (timeout after ${maxWaitSeconds}s)`);
    }

    try {
        // Execute function with lock held
        return await fn();
    } finally {
        // Always release lock, even if function throws
        await releaseLock(lockKey);
    }
}

module.exports = {
    acquireLock,
    releaseLock,
    withLock
};

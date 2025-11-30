const db = require('../config/database');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

/**
 * Daily Burn Limits by Tier
 * Tier 1 (₹499): 8 tokens/day
 * Tier 2 (₹1,499): 16 tokens/day
 * Tier 3 (₹2,999): 24 tokens/day
 * Tier 4 (₹4,999): 32 tokens/day
 */

const TIER_LIMITS = {
    'tier_1': { daily: 8, price: 499 },
    'tier_2': { daily: 16, price: 1499 },
    'tier_3': { daily: 24, price: 2999 },
    'tier_4': { daily: 32, price: 4999 }
};

class DailyBurnLimitService {
    async checkAndEnforce(tenantId, tokensToDeduct) {
        try {
            // Get tenant's tier
            const tier = await this._getTenantTier(tenantId);
            const limit = TIER_LIMITS[tier]?.daily || 8;

            const today = new Date().toISOString().split('T')[0];
            const key = `daily_burn:${tenantId}:${today}`;

            // Get current burn
            const currentBurn = await redis.get(key);
            const burned = currentBurn ? parseFloat(currentBurn) : 0;

            // Check if it would exceed limit
            if (burned + tokensToDeduct > limit) {
                logger.warn({ tenantId, burned, limit, requested: tokensToDeduct }, 'Daily burn limit exceeded');
                return {
                    allowed: false,
                    burned,
                    limit,
                    remaining: Math.max(0, limit - burned),
                    message: 'Daily token limit exceeded. Upgrade your tier or wait until tomorrow.'
                };
            }

            // Increment burn (with expiry at end of day)
            const newBurn = burned + tokensToDeduct;
            const ttl = this._getSecondsUntilMidnight();
            await redis.setex(key, ttl, newBurn.toString());

            return {
                allowed: true,
                burned: newBurn,
                limit,
                remaining: limit - newBurn
            };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Daily burn limit check failed');
            // Fail open - allow operation
            return { allowed: true };
        }
    }

    async _getTenantTier(tenantId) {
        try {
            const res = await db.query(
                `SELECT tier FROM tenants WHERE id = $1`,
                [tenantId]
            );
            return res.rows[0]?.tier || 'tier_1';
        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to get tenant tier');
            return 'tier_1'; // Default to lowest tier
        }
    }

    _getSecondsUntilMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return Math.floor((midnight - now) / 1000);
    }

    async getCurrentBurn(tenantId) {
        const today = new Date().toISOString().split('T')[0];
        const key = `daily_burn:${tenantId}:${today}`;
        const burn = await redis.get(key);
        return parseFloat(burn) || 0;
    }
}

module.exports = new DailyBurnLimitService();

/**
 * AI Cost Tracking and Rate Limiting Middleware
 * 
 * FIXES: CRITICAL #5 - No AI cost caps allows runaway costs
 * 
 * Features:
 * - Per-tenant token tracking
 * - Daily spending caps
 * - Emergency kill-switch
 * - Soft alerts at thresholds
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cost per 1K tokens (GPT-4 pricing as of 2024)
const COST_PER_1K_INPUT_TOKENS = 0.03;
const COST_PER_1K_OUTPUT_TOKENS = 0.06;

// Default caps (can be overridden per tenant)
const DEFAULT_DAILY_CAP_USD = parseFloat(process.env.AI_COST_CAP_USD || '100');
const SOFT_ALERT_THRESHOLD = 0.8; // Alert at 80% of cap

/**
 * Track AI token usage and enforce caps
 * 
 * @param {string} tenantId - Tenant/user ID
 * @param {number} inputTokens - Input tokens used
 * @param {number} outputTokens - Output tokens used
 * @param {string} model - AI model used
 * @returns {Promise<Object>} Usage statistics and cap status
 */
async function trackAIUsage(tenantId, inputTokens, outputTokens, model = 'gpt-4') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageKey = `ai:usage:${tenantId}:${today}`;
    const pauseKey = `ai:pause:${tenantId}`;

    // Check if AI is paused for this tenant
    const isPaused = await redis.get(pauseKey);
    if (isPaused) {
        logger.warn('AI paused for tenant', { tenantId, reason: isPaused });
        throw new Error(`AI services paused for tenant ${tenantId}: ${isPaused}`);
    }

    // Calculate cost
    const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS;
    const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;
    const totalCost = inputCost + outputCost;

    // Get current usage
    const currentUsage = await redis.hgetall(usageKey);
    const currentCostUSD = parseFloat(currentUsage.cost_usd || '0');
    const newTotalCost = currentCostUSD + totalCost;

    // Get tenant-specific cap (or use default)
    const capKey = `ai:cap:${tenantId}`;
    const tenantCap = parseFloat(await redis.get(capKey) || String(DEFAULT_DAILY_CAP_USD));

    // Check if adding this usage would exceed cap
    if (newTotalCost > tenantCap) {
        logger.error('AI cost cap exceeded', {
            tenantId,
            currentCost: newTotalCost,
            cap: tenantCap,
            attemptedCost: totalCost
        });

        // Auto-pause tenant if cap exceeded
        await redis.set(pauseKey, 'Daily cost cap exceeded', 'EX', 86400); // 24h pause

        throw new Error(`AI cost cap exceeded: $${newTotalCost.toFixed(2)} / $${tenantCap}`);
    }

    // Update usage
    await redis.hmset(usageKey, {
        input_tokens: (parseInt(currentUsage.input_tokens || '0') + inputTokens).toString(),
        output_tokens: (parseInt(currentUsage.output_tokens || '0') + outputTokens).toString(),
        cost_usd: newTotalCost.toFixed(4),
        requests: (parseInt(currentUsage.requests || '0') + 1).toString(),
        last_updated: Date.now().toString()
    });

    // Set TTL to expire at end of day (midnight)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.floor((midnight - now) / 1000);
    await redis.expire(usageKey, ttlSeconds);

    // Check soft alert threshold
    const usagePercent = (newTotalCost / tenantCap) * 100;
    if (usagePercent >= SOFT_ALERT_THRESHOLD * 100) {
        logger.warn('AI cost soft alert threshold reached', {
            tenantId,
            cost: newTotalCost,
            cap: tenantCap,
            percent: usagePercent.toFixed(1)
        });
    }

    return {
        cost: {
            current: newTotalCost,
            cap: tenantCap,
            remaining: tenantCap - newTotalCost,
            percentUsed: usagePercent
        },
        tokens: {
            input: parseInt(currentUsage.input_tokens || '0') + inputTokens,
            output: parseInt(currentUsage.output_tokens || '0') + outputTokens,
            total: parseInt(currentUsage.input_tokens || '0') + inputTokens + parseInt(currentUsage.output_tokens || '0') + outputTokens
        },
        requests: parseInt(currentUsage.requests || '0') + 1
    };
}

/**
 * Get AI usage statistics for a tenant
 */
async function getAIUsage(tenantId, date = null) {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const usageKey = `ai:usage:${tenantId}:${dateStr}`;

    const usage = await redis.hgetall(usageKey);

    if (!usage || Object.keys(usage).length === 0) {
        return {
            cost_usd: 0,
            input_tokens: 0,
            output_tokens: 0,
            requests: 0
        };
    }

    return {
        cost_usd: parseFloat(usage.cost_usd || '0'),
        input_tokens: parseInt(usage.input_tokens || '0'),
        output_tokens: parseInt(usage.output_tokens || '0'),
        requests: parseInt(usage.requests || '0'),
        last_updated: new Date(parseInt(usage.last_updated || '0'))
    };
}

/**
 * Pause AI for a tenant (emergency kill-switch)
 */
async function pauseAIForTenant(tenantId, reason = 'Manual pause', durationSeconds = 86400) {
    const pauseKey = `ai:pause:${tenantId}`;
    await redis.set(pauseKey, reason, 'EX', durationSeconds);

    logger.warn('AI paused for tenant', { tenantId, reason, durationSeconds });

    return { paused: true, reason, expiresIn: durationSeconds };
}

/**
 * Resume AI for a tenant
 */
async function resumeAIForTenant(tenantId) {
    const pauseKey = `ai:pause:${tenantId}`;
    await redis.del(pauseKey);

    logger.info('AI resumed for tenant', { tenantId });

    return { paused: false };
}

/**
 * Set custom cap for tenant
 */
async function setTenantCap(tenantId, capUSD) {
    const capKey = `ai:cap:${tenantId}`;
    await redis.set(capKey, capUSD.toString());

    logger.info('AI cap updated for tenant', { tenantId, capUSD });

    return { cap: capUSD };
}

module.exports = {
    trackAIUsage,
    getAIUsage,
    pauseAIForTenant,
    resumeAIForTenant,
    setTenantCap
};

const db = require('../../config/database');
const logger = require('../../utils/logger');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class AbuseDetectionService {
    /**
     * Enhanced Abuse Protection
     * - Token Drain Attack Detection (10x spike → pause)
     * - Spam lead creation (20x → block)
     * - Auto-suspension logic
     */

    async detectAbusePatterns(tenantId) {
        const patterns = {
            tokenDrainAttack: false,
            spamLeadCreation: false,
            suspiciousActivity: false,
            shouldSuspend: false,
            details: []
        };

        // 1. Token Drain Attack Detection
        const drainCheck = await this._checkTokenDrainAttack(tenantId);
        if (drainCheck.isAttack) {
            patterns.tokenDrainAttack = true;
            patterns.details.push(drainCheck.reason);
        }

        // 2. Spam Lead Creation
        const spamCheck = await this._checkSpamLeadCreation(tenantId);
        if (spamCheck.isSpam) {
            patterns.spamLeadCreation = true;
            patterns.details.push(spamCheck.reason);
        }

        // 3. Repeated Failures
        const failureCheck = await this._checkRepeatedFailures(tenantId);
        if (failureCheck.excessive) {
            patterns.suspiciousActivity = true;
            patterns.details.push(failureCheck.reason);
        }

        // Determine if should suspend
        if (patterns.tokenDrainAttack || patterns.spamLeadCreation) {
            patterns.shouldSuspend = true;
            await this._takeAbuseAction(tenantId, patterns);
        }

        return patterns;
    }

    async _checkTokenDrainAttack(tenantId) {
        try {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);

            // Get token usage in last hour
            const recentUsage = await db.query(
                `SELECT COALESCE(SUM(tokens), 0) as total
                 FROM token_ledger
                 WHERE tenant_id = $1 
                   AND created_at > to_timestamp($2 / 1000.0)
                   AND type = 'deduction'`,
                [tenantId, oneHourAgo]
            );

            // Get average hourly usage (last 24 hours)
            const avgUsage = await db.query(
                `SELECT COALESCE(AVG(hourly_total), 0) as avg
                 FROM (
                     SELECT date_trunc('hour', created_at) as hour, SUM(tokens) as hourly_total
                     FROM token_ledger
                     WHERE tenant_id = $1 
                       AND created_at > NOW() - INTERVAL '24 hours'
                       AND type = 'deduction'
                     GROUP BY hour
                 ) hourly`,
                [tenantId]
            );

            const recent = parseFloat(recentUsage.rows[0].total);
            const avg = parseFloat(avgUsage.rows[0].avg);

            // 10x spike detection
            if (avg > 0 && recent > (avg * 10)) {
                logger.warn({ tenantId, recent, avg, spike: recent / avg }, 'Token drain attack detected');
                return {
                    isAttack: true,
                    reason: `Token drain attack: ${recent} tokens in 1h vs ${avg.toFixed(2)} avg (${(recent / avg).toFixed(1)}x spike)`
                };
            }

            return { isAttack: false };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Token drain check failed');
            return { isAttack: false };
        }
    }

    async _checkSpamLeadCreation(tenantId) {
        try {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);

            // Get leads created in last hour
            const recentCreation = await db.query(
                `SELECT COUNT(*) as count
                 FROM leads
                 WHERE tenant_id = $1 
                   AND created_at > to_timestamp($2 / 1000.0)`,
                [tenantId, oneHourAgo]
            );

            // Get average hourly creation rate
            const avgCreation = await db.query(
                `SELECT COALESCE(AVG(hourly_count), 0) as avg
                 FROM (
                     SELECT date_trunc('hour', created_at) as hour, COUNT(*) as hourly_count
                     FROM leads
                     WHERE tenant_id = $1 
                       AND created_at > NOW() - INTERVAL '24 hours'
                     GROUP BY hour
                 ) hourly`,
                [tenantId]
            );

            const recent = parseInt(recentCreation.rows[0].count);
            const avg = parseFloat(avgCreation.rows[0].avg);

            // 20x spike detection
            if (avg > 0 && recent > (avg * 20)) {
                logger.warn({ tenantId, recent, avg, spike: recent / avg }, 'Spam lead creation detected');
                return {
                    isSpam: true,
                    reason: `Spam lead creation: ${recent} leads in 1h vs ${avg.toFixed(2)} avg (${(recent / avg).toFixed(1)}x spike)`
                };
            }

            return { isSpam: false };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Spam lead check failed');
            return { isSpam: false };
        }
    }

    async _checkRepeatedFailures(tenantId) {
        try {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);

            // Check for excessive API failures
            const key = `api_failures:${tenantId}`;
            const failures = await redis.get(key);
            const failureCount = failures ? parseInt(failures) : 0;

            if (failureCount > 100) {
                return {
                    excessive: true,
                    reason: `Excessive API failures: ${failureCount} in 1 hour`
                };
            }

            return { excessive: false };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failure check failed');
            return { excessive: false };
        }
    }

    async _takeAbuseAction(tenantId, patterns) {
        try {
            // 1. Pause high-token operations
            await this._pauseHighTokenOperations(tenantId);

            // 2. Alert admins
            await this._alertAdmins(tenantId, patterns);

            // 3. Log abuse event
            await db.query(
                `INSERT INTO abuse_events (tenant_id, patterns, action_taken, created_at)
                 VALUES ($1, $2, 'pause_high_token_operations', NOW())`,
                [tenantId, JSON.stringify(patterns)]
            );

            logger.error({ tenantId, patterns }, 'Abuse detected - high-token operations paused');

        } catch (error) {
            logger.error({ err: error, ten antId }, 'Failed to take abuse action');
        }
    }

    async _pauseHighTokenOperations(tenantId) {
        const TTL = 3600; // 1 hour
        await redis.setex(`abuse_pause:${tenantId}`, TTL, 'true');
    }

    async _alertAdmins(tenantId, patterns) {
        // TODO: Send email/SMS to admins
        logger.warn({ tenantId, patterns }, 'Admin abuse alert triggered');
    }

    async isAbuserPaused(tenantId) {
        const paused = await redis.get(`abuse_pause:${tenantId}`);
        return paused === 'true';
    }
}

module.exports = new AbuseDetectionService();

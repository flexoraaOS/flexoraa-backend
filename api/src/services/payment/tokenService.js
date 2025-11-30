const db = require('../../config/database');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class TokenService {
    /**
     * Get current token balance for a tenant
     */
    async getBalance(tenantId) {
        const result = await db.query(
            'SELECT balance, is_paused FROM token_balances WHERE tenant_id = $1',
            [tenantId]
        );

        if (result.rows.length === 0) {
            return { balance: 0, is_paused: false };
        }

        return {
            balance: parseFloat(result.rows[0].balance),
            is_paused: result.rows[0].is_paused
        };
    }

    /**
     * Deduct tokens for an operation
     * @param {string} tenantId 
     * @param {number} amount - Positive number (will be negated)
     * @param {string} operation - 'verification', 'ai_response', etc.
     * @param {string} description 
     * @param {string} referenceId - Optional (message_id, lead_id)
     */
    async deductTokens(tenantId, amount, operation, description, referenceId = null) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Check Balance
            const balanceRes = await client.query(
                'SELECT balance FROM token_balances WHERE tenant_id = $1 FOR UPDATE',
                [tenantId]
            );

            const currentBalance = balanceRes.rows[0] ? parseFloat(balanceRes.rows[0].balance) : 0;

            if (currentBalance < amount) {
                throw new AppError('Insufficient tokens. Please top up.', 402);
            }

            // 2. Insert into Ledger (Trigger will update balance)
            const result = await client.query(
                `INSERT INTO token_ledger (tenant_id, amount, operation_type, description, reference_id)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [tenantId, -amount, operation, description, referenceId]
            );

            await client.query('COMMIT');

            // 3. Audit Log (Async, non-blocking)
            const auditService = require('../compliance/auditService');
            auditService.logEvent(tenantId, 'SYSTEM', 'token_deducted', result.rows[0].id, {
                amount: -amount,
                operation,
                description
            });

            logger.info({ tenantId, amount, operation }, 'Tokens deducted');
            return true;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, tenantId, operation }, 'Token deduction failed');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Top up tokens (after payment)
     */
    async topUpTokens(tenantId, amount, paymentId, description = 'Token Pack Purchase') {
        await db.query(
            `INSERT INTO token_ledger (tenant_id, amount, operation_type, description, reference_id)
             VALUES ($1, $2, 'top_up', $3, $4)`,
            [tenantId, amount, description, paymentId]
        );

        logger.info({ tenantId, amount, paymentId }, 'Tokens topped up');

        // Unpause if paused
        await db.query(
            "UPDATE token_balances SET is_paused = false WHERE tenant_id = $1",
            [tenantId]
        );
    }

    /**
     * Check token threshold and send alerts
     * Thresholds: 50% (warning), 80% (urgent), 100% (pause)
     */
    async checkThresholds(tenantId) {
        try {
            const result = await db.query(
                `SELECT tb.balance, tb.is_paused, s.token_allocation, u.email
                 FROM token_balances tb
                 JOIN subscriptions s ON s.tenant_id = tb.tenant_id AND s.status = 'active'
                 JOIN users u ON u.tenant_id = tb.tenant_id AND u.role = 'admin'
                 WHERE tb.tenant_id = $1
                 LIMIT 1`,
                [tenantId]
            );

            if (result.rows.length === 0) return;

            const { balance, is_paused, token_allocation, email } = result.rows[0];
            const usagePercent = ((token_allocation - balance) / token_allocation) * 100;

            // 100% consumed - pause service
            if (balance <= 0 && !is_paused) {
                await db.query(
                    'UPDATE token_balances SET is_paused = true WHERE tenant_id = $1',
                    [tenantId]
                );
                await this._sendAlert(email, tenantId, 'depleted', usagePercent);
                logger.warn({ tenantId, balance }, 'Token balance depleted - service paused');
            }
            // 80% consumed - urgent alert
            else if (usagePercent >= 80) {
                await this._sendAlert(email, tenantId, 'urgent', usagePercent);
            }
            // 50% consumed - warning alert
            else if (usagePercent >= 50) {
                await this._sendAlert(email, tenantId, 'warning', usagePercent);
            }
        } catch (error) {
            logger.error({ err: error, tenantId }, 'Threshold check failed');
        }
    }

    async _sendAlert(email, tenantId, level, usagePercent) {
        const emailService = require('../emailService');
        
        const subjects = {
            warning: '⚠️ Token Usage Alert: 50% Consumed',
            urgent: '🚨 Urgent: 80% Token Usage - Top Up Recommended',
            depleted: '❌ Service Paused: Token Balance Depleted'
        };

        const messages = {
            warning: `You've used 50% of your monthly token allocation. Consider monitoring usage or upgrading your plan.`,
            urgent: `You've used 80% of your tokens! Top up now to avoid service interruption. Upgrade for better value.`,
            depleted: `Your token balance is depleted. Service is paused. Please top up immediately to resume operations.`
        };

        await emailService.sendEmail({
            to: email,
            subject: subjects[level],
            html: `
                <h2>${subjects[level]}</h2>
                <p>${messages[level]}</p>
                <p><strong>Current Usage:</strong> ${usagePercent.toFixed(1)}%</p>
                <p><a href="${process.env.FRONTEND_URL}/dashboard/billing">Top Up Now</a></p>
            `
        });

        logger.info({ tenantId, level, usagePercent }, 'Token threshold alert sent');
    }

    /**
     * Get token usage statistics
     */
    async getUsageStats(tenantId, days = 30) {
        const result = await db.query(
            `SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as consumed,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as added,
                operation_type
             FROM token_ledger
             WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
             GROUP BY DATE(created_at), operation_type
             ORDER BY date DESC`,
            [tenantId]
        );

        return result.rows;
    }
}

module.exports = new TokenService();

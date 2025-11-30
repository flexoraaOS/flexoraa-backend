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
}

module.exports = new TokenService();

/**
 * Lead Assignment with DB Advisory Locks
 * 
 * FIXES: CRITICAL #3 - Missing DB advisory locks causes duplicate assignments
 * 
 * Uses Postgres SELECT FOR UPDATE to prevent race conditions
 */

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Assign lead to agent with race condition protection
 * 
 * @param {string} leadId - Lead ID to assign
 * @param {string} agentId - Agent ID to assign to
 * @param {string} traceId - Request trace ID for logging
 * @returns {Promise<Object>} Assignment result
 * @throws {Error} If lead already assigned or not found
 */
async function assignLeadToAgent(leadId, agentId, traceId) {
    const client = await db.connect();

    try {
        // Start transaction
        await client.query('BEGIN');

        // SELECT FOR UPDATE locks the row until transaction completes
        // This prevents other transactions from reading/writing this row
        const leadResult = await client.query(
            'SELECT id, assigned_to, status FROM leads WHERE id = $1 FOR UPDATE',
            [leadId]
        );

        if (leadResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw new Error(`Lead not found: ${leadId}`);
        }

        const lead = leadResult.rows[0];

        // Check if already assigned
        if (lead.assigned_to) {
            await client.query('ROLLBACK');
            logger.warn('Lead already assigned', {
                leadId,
                currentAgent: lead.assigned_to,
                attemptedAgent: agentId,
                traceId
            });
            throw new Error(`Lead ${leadId} already assigned to ${lead.assigned_to}`);
        }

        // Perform assignment
        const updateResult = await client.query(
            `UPDATE leads 
       SET assigned_to = $1, 
           status = 'assigned', 
           assigned_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
            [agentId, leadId]
        );

        // Commit transaction
        await client.query('COMMIT');

        const updatedLead = updateResult.rows[0];

        logger.info('Lead assigned successfully', {
            leadId,
            agentId,
            traceId
        });

        return {
            success: true,
            lead: updatedLead
        };

    } catch (error) {
        // Rollback on any error
        await client.query('ROLLBACK');
        logger.error('Lead assignment failed', {
            leadId,
            agentId,
            error: error.message,
            traceId
        });
        throw error;
    } finally {
        // Always release client back to pool
        client.release();
    }
}

/**
 * Bulk assign leads with proper locking
 * Prevents race conditions when multiple workers assign leads
 * 
 * @param {Array<{leadId: string, agentId: string}>} assignments - Array of assignments
 * @param {string} traceId - Request trace ID
 * @returns {Promise<Object>} Results with successes and failures
 */
async function bulkAssignLeads(assignments, traceId) {
    const results = {
        succeeded: [],
        failed: []
    };

    // Process sequentially to avoid deadlocks
    for (const { leadId, agentId } of assignments) {
        try {
            const result = await assignLeadToAgent(leadId, agentId, traceId);
            results.succeeded.push({ leadId, agentId, ...result });
        } catch (error) {
            results.failed.push({
                leadId,
                agentId,
                error: error.message
            });
        }
    }

    logger.info('Bulk assignment completed', {
        total: assignments.length,
        succeeded: results.succeeded.length,
        failed: results.failed.length,
        traceId
    });

    return results;
}

module.exports = {
    assignLeadToAgent,
    bulkAssignLeads
};

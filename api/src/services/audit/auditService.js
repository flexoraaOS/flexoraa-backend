// Audit Service
// Comprehensive tracking of all lead operations (append-only)
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Log audit event
 */
async function logAudit(data) {
    const { leadId, userId, action, changes, actor, ipAddress } = data;

    try {
        const result = await db.query(
            `INSERT INTO lead_audit (lead_id, user_id, action, changes, actor, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                leadId,
                userId || null,
                action,
                JSON.stringify(changes),
                actor || 'system',
                ipAddress || null
            ]
        );

        logger.debug({ auditId: result.rows[0].id, action, leadId }, 'Audit logged');
        return result.rows[0];
    } catch (error) {
        logger.error({ err: error, leadId, action }, 'Failed to log audit');
        // Don't throw - audit logging should not break main operations
    }
}

/**
 * Log lead creation
 */
async function logLeadCreated(leadId, leadData, actor, ipAddress) {
    return logAudit({
        leadId,
        userId: leadData.user_id,
        action: 'created',
        changes: { new: leadData },
        actor,
        ipAddress
    });
}

/**
 * Log lead update
 */
async function logLeadUpdated(leadId, beforeData, afterData, actor, ipAddress) {
    return logAudit({
        leadId,
        userId: afterData.user_id,
        action: 'updated',
        changes: { before: beforeData, after: afterData },
        actor,
        ipAddress
    });
}

/**
 * Log lead deletion
 */
async function logLeadDeleted(leadId, leadData, actor, ipAddress) {
    return logAudit({
        leadId,
        userId: leadData.user_id,
        action: 'deleted',
        changes: { deleted: leadData },
        actor,
        ipAddress
    });
}

/**
 * Log lead assignment
 */
async function logLeadAssigned(leadId, sdrUserId, assignmentId, actor, ipAddress) {
    return logAudit({
        leadId,
        userId: sdrUserId,
        action: 'assigned',
        changes: { assignmentId, sdrUserId },
        actor,
        ipAddress
    });
}

/**
 * Log lead booking
 */
async function logLeadBooked(leadId, bookingData, actor, ipAddress) {
    return logAudit({
        leadId,
        userId: bookingData.user_id,
        action: 'booked',
        changes: { booked_timestamp: bookingData.booked_timestamp },
        actor,
        ipAddress
    });
}

/**
 * Get audit trail for a lead
 */
async function getAuditTrail(leadId, options = {}) {
    const { limit = 50 } = options;

    const result = await db.query(
        `SELECT * FROM lead_audit
         WHERE lead_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [leadId, limit]
    );

    return result.rows;
}

/**
 * Get recent audit events (for admin dashboard)
 */
async function getRecentAudit(options = {}) {
    const { limit = 100, action = null } = options;

    let query = `SELECT * FROM lead_audit`;
    const params = [];

    if (action) {
        query += ` WHERE action = $1`;
        params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
}

module.exports = {
    logAudit,
    logLeadCreated,
    logLeadUpdated,
    logLeadDeleted,
    logLeadAssigned,
    logLeadBooked,
    getAuditTrail,
    getRecentAudit
};

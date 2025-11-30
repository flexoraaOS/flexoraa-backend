const db = require('../../config/database');
const logger = require('../../utils/logger');
const crypto = require('crypto');

class AuditService {
    /**
     * Log a critical system event (Immutable)
     * @param {string} tenantId 
     * @param {string} actorId - User ID or 'SYSTEM'
     * @param {string} eventType - e.g., 'lead_created', 'token_deducted'
     * @param {string} resourceId - ID of affected resource
     * @param {object} metadata - Additional context
     */
    async logEvent(tenantId, actorId, eventType, resourceId, metadata = {}) {
        try {
            // 1. Create Tamper-Evident Hash
            // Hash = SHA256(tenantId + actorId + eventType + resourceId + JSON(metadata) + timestamp)
            const timestamp = new Date().toISOString();
            const dataToHash = `${tenantId}:${actorId}:${eventType}:${resourceId}:${JSON.stringify(metadata)}:${timestamp}`;
            const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            // 2. Insert Log
            await db.query(
                `INSERT INTO audit_logs (tenant_id, actor_id, event_type, resource_id, metadata, hash, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [tenantId, actorId, eventType, resourceId, metadata, hash, timestamp]
            );

            logger.info({ tenantId, eventType, resourceId }, 'Audit log created');

        } catch (error) {
            // Audit logging failure is CRITICAL. We must log to stderr at minimum.
            logger.error({ err: error, tenantId, eventType }, 'CRITICAL: Failed to write audit log');
        }
    }

    /**
     * Fetch audit logs for a tenant
     */
    async getLogs(tenantId, limit = 50, offset = 0) {
        const result = await db.query(
            `SELECT * FROM audit_logs 
             WHERE tenant_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [tenantId, limit, offset]
        );
        return result.rows;
    }
}

module.exports = new AuditService();

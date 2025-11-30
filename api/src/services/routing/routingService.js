const db = require('../../config/database');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class RoutingService {
    /**
     * Route lead to appropriate SDR based on score
     * HOT (61-100): Instant to available SDR (SLA: 10m)
     * WARM (31-60): Equal distribution (SLA: 24-72h)
     * COLD (0-30): AI recovery, then junior SDR
     */
    async routeLead(leadId, score) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Get lead details
            const leadRes = await client.query(
                'SELECT * FROM leads WHERE id = $1',
                [leadId]
            );
            const lead = leadRes.rows[0];

            let sdrId;
            let priority;
            let sla;

            // 2. Route based on score
            if (score >= 61) {
                // HOT: Instant routing to available SDR
                sdrId = await this._getAvailableSDR(client, lead.tenant_id, 'senior');
                priority = 'urgent';
                sla = '10m';

                // Send immediate notification
                await this._notifySDR(sdrId, lead, 'HOT', priority);
            } else if (score >= 31) {
                // WARM: Equal distribution
                sdrId = await this._getNextSDRInRotation(client, lead.tenant_id, 'mid');
                priority = 'normal';
                sla = '24-72h';
            } else {
                // COLD: Mark for AI recovery first
                await this._scheduleAIRecovery(client, leadId);
                sdrId = await this._getJuniorSDR(client, lead.tenant_id);
                priority = 'low';
                sla = '48-72h';
            }

            // 3. Assign lead to SDR
            await client.query(
                `UPDATE leads 
                 SET assigned_sdr_id = $1, 
                     routing_priority = $2,
                     routing_sla = $3,
                     routed_at = NOW()
                 WHERE id = $4`,
                [sdrId, priority, sla, leadId]
            );

            // 4. Create routing record
            await client.query(
                `INSERT INTO lead_routing_history (lead_id, sdr_id, score, priority, sla, routed_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [leadId, sdrId, score, priority, sla]
            );

            await client.query('COMMIT');

            logger.info({ leadId, sdrId, score, priority }, 'Lead routed successfully');

            // Deduct token
            const tokenService = require('../payment/tokenService');
            await tokenService.deductTokens(lead.tenant_id, 1, 'routing', `Lead routing: ${leadId}`, leadId);

            return { sdrId, priority, sla };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, leadId }, 'Routing failed');
            throw error;
        } finally {
            client.release();
        }
    }

    async _getAvailableSDR(client, tenantId, level) {
        // Get SDR with lowest current load
        const res = await client.query(
            `SELECT u.id 
             FROM users u
             LEFT JOIN leads l ON l.assigned_sdr_id = u.id AND l.status != 'closed'
             WHERE u.tenant_id = $1 
               AND u.role = 'sdr' 
               AND u.sdr_level = $2
               AND u.is_active = true
             GROUP BY u.id
             ORDER BY COUNT(l.id) ASC
             LIMIT 1`,
            [tenantId, level]
        );

        if (res.rows.length === 0) {
            // Fallback to any available SDR
            const fallback = await client.query(
                `SELECT id FROM users 
                 WHERE tenant_id = $1 AND role = 'sdr' AND is_active = true 
                 LIMIT 1`,
                [tenantId]
            );
            return fallback.rows[0]?.id;
        }

        return res.rows[0].id;
    }

    async _getNextSDRInRotation(client, tenantId, level) {
        // Round-robin distribution
        const res = await client.query(
            `SELECT u.id 
             FROM users u
             LEFT JOIN leads l ON l.assigned_sdr_id = u.id AND l.routed_at > NOW() - INTERVAL '24 hours'
             WHERE u.tenant_id = $1 
               AND u.role = 'sdr'
               AND u.sdr_level = $2
               AND u.is_active = true
             GROUP BY u.id
             ORDER BY COUNT(l.id) ASC, RANDOM()
             LIMIT 1`,
            [tenantId, level]
        );
        return res.rows[0]?.id;
    }

    async _getJuniorSDR(client, tenantId) {
        const res = await client.query(
            `SELECT id FROM users 
             WHERE tenant_id = $1 AND role = 'sdr' AND sdr_level = 'junior' AND is_active = true
             ORDER BY RANDOM()
             LIMIT 1`,
            [tenantId]
        );
        return res.rows[0]?.id;
    }

    async _scheduleAIRecovery(client, leadId) {
        // Schedule AI recovery in 24 hours
        await client.query(
            `INSERT INTO scheduled_tasks (task_type, lead_id, scheduled_for)
             VALUES ('ai_recovery', $1, NOW() + INTERVAL '24 hours')`,
            [leadId]
        );
    }

    async _notifySDR(sdrId, lead, category, priority) {
        // TODO: Send notification (email, SMS, push)
        logger.info({ sdrId, leadId: lead.id, category, priority }, 'SDR notified');
    }
}

module.exports = new RoutingService();

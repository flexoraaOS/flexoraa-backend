const db = require('../../config/database');
const logger = require('../../utils/logger');

class AdminDashboardService {
    /**
     * Get admin dashboard overview
     * Frontend: /dashboard/admin-dashboard
     */
    async getOverview() {
        try {
            const overview = {
                system: await this._getSystemStats(),
                tenants: await this._getTenantStats(),
                revenue: await this._getRevenueStats(),
                usage: await this._getUsageStats(),
                health: await this._getSystemHealth()
            };

            return overview;

        } catch (error) {
            logger.error({ err: error }, 'Failed to get admin overview');
            throw error;
        }
    }

    async _getSystemStats() {
        const res = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM leads) as total_leads,
                (SELECT COUNT(*) FROM leads WHERE created_at > NOW() - INTERVAL '24 hours') as leads_today,
                (SELECT COUNT(*) FROM conversations) as total_conversations,
                (SELECT COUNT(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours') as conversations_today
        `);

        return res.rows[0];
    }

    async _getTenantStats() {
        const res = await db.query(`
            SELECT 
                t.id,
                t.name,
                t.tier,
                t.status,
                t.created_at,
                COUNT(DISTINCT u.id) as user_count,
                COUNT(DISTINCT l.id) as lead_count,
                COALESCE(SUM(tl.tokens), 0) as tokens_used,
                t.metadata->>'token_balance' as token_balance
            FROM tenants t
            LEFT JOIN users u ON u.id = ANY(
                SELECT user_id FROM user_metadata WHERE tenant_id = t.id
            )
            LEFT JOIN leads l ON l.tenant_id = t.id
            LEFT JOIN token_ledger tl ON tl.tenant_id = t.id AND tl.type = 'deduction'
            WHERE t.status = 'active'
            GROUP BY t.id, t.name, t.tier, t.status, t.created_at, t.metadata
            ORDER BY COUNT(DISTINCT l.id) DESC
            LIMIT 20
        `);

        return res.rows;
    }

    async _getRevenueStats() {
        const res = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as total_transactions,
                COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
                COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'), 0) as revenue_30d,
                COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '7 days'), 0) as revenue_7d,
                COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '1 day'), 0) as revenue_today,
                AVG(amount) FILTER (WHERE status = 'completed') as avg_transaction_value
            FROM payments
        `);

        const revenue = res.rows[0];

        // Get revenue by tier
        const tierRevenue = await db.query(`
            SELECT 
                t.tier,
                COUNT(p.id) as transaction_count,
                COALESCE(SUM(p.amount), 0) as total_revenue
            FROM payments p
            JOIN tenants t ON p.tenant_id = t.id
            WHERE p.status = 'completed'
            GROUP BY t.tier
            ORDER BY total_revenue DESC
        `);

        revenue.by_tier = tierRevenue.rows;

        return revenue;
    }

    async _getUsageStats() {
        const res = await db.query(`
            SELECT 
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction'), 0) as total_tokens_used,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '30 days'), 0) as tokens_30d,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '7 days'), 0) as tokens_7d,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '1 day'), 0) as tokens_today,
                COUNT(DISTINCT tenant_id) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '1 day') as active_tenants_today
            FROM token_ledger
        `);

        const usage = res.rows[0];

        // Get usage by operation type
        const operationUsage = await db.query(`
            SELECT 
                operation_type,
                COUNT(*) as operation_count,
                COALESCE(SUM(tokens), 0) as total_tokens
            FROM token_ledger
            WHERE type = 'deduction'
              AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY operation_type
            ORDER BY total_tokens DESC
            LIMIT 10
        `);

        usage.by_operation = operationUsage.rows;

        return usage;
    }

    async _getSystemHealth() {
        const health = {
            status: 'healthy',
            checks: []
        };

        try {
            // Database check
            const dbCheck = await db.query('SELECT NOW()');
            health.checks.push({
                name: 'Database',
                status: 'healthy',
                response_time: '< 10ms'
            });

            // Check for failed jobs
            const failedJobs = await db.query(`
                SELECT COUNT(*) as count 
                FROM background_jobs 
                WHERE status = 'failed' 
                  AND created_at > NOW() - INTERVAL '1 hour'
            `);

            health.checks.push({
                name: 'Background Jobs',
                status: parseInt(failedJobs.rows[0].count) > 10 ? 'degraded' : 'healthy',
                failed_jobs_1h: failedJobs.rows[0].count
            });

            // Check for abuse alerts
            const abuseAlerts = await db.query(`
                SELECT COUNT(*) as count 
                FROM abuse_events 
                WHERE created_at > NOW() - INTERVAL '1 hour'
            `);

            health.checks.push({
                name: 'Abuse Detection',
                status: parseInt(abuseAlerts.rows[0].count) > 5 ? 'warning' : 'healthy',
                alerts_1h: abuseAlerts.rows[0].count
            });

            // Overall status
            const hasWarning = health.checks.some(c => c.status === 'warning');
            const hasDegraded = health.checks.some(c => c.status === 'degraded');
            
            if (hasDegraded) health.status = 'degraded';
            else if (hasWarning) health.status = 'warning';

        } catch (error) {
            health.status = 'unhealthy';
            health.error = error.message;
            logger.error({ err: error }, 'System health check failed');
        }

        return health;
    }

    /**
     * Get tenant details
     */
    async getTenantDetails(tenantId) {
        try {
            const tenant = await db.query(
                `SELECT * FROM tenants WHERE id = $1`,
                [tenantId]
            );

            if (tenant.rows.length === 0) {
                throw new Error('Tenant not found');
            }

            const details = tenant.rows[0];

            // Get users
            details.users = await this._getTenantUsers(tenantId);

            // Get leads stats
            details.leads_stats = await this._getTenantLeadsStats(tenantId);

            // Get token usage
            details.token_usage = await this._getTenantTokenUsage(tenantId);

            // Get recent activity
            details.recent_activity = await this._getTenantRecentActivity(tenantId);

            return details;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to get tenant details');
            throw error;
        }
    }

    async _getTenantUsers(tenantId) {
        const res = await db.query(
            `SELECT u.id, u.name, u.email, um.role, um.status, u.created_at
             FROM users u
             JOIN user_metadata um ON u.id = um.user_id
             WHERE um.tenant_id = $1
             ORDER BY u.created_at DESC`,
            [tenantId]
        );

        return res.rows;
    }

    async _getTenantLeadsStats(tenantId) {
        const res = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE stage = 'hot') as hot,
                COUNT(*) FILTER (WHERE stage = 'warm') as warm,
                COUNT(*) FILTER (WHERE stage = 'cold') as cold,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'converted') as converted,
                AVG(score) as avg_score
             FROM leads
             WHERE tenant_id = $1`,
            [tenantId]
        );

        return res.rows[0];
    }

    async _getTenantTokenUsage(tenantId) {
        const res = await db.query(
            `SELECT 
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction'), 0) as total_used,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'credit'), 0) as total_credited,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '30 days'), 0) as used_30d,
                COALESCE(SUM(tokens) FILTER (WHERE type = 'deduction' AND created_at > NOW() - INTERVAL '7 days'), 0) as used_7d
             FROM token_ledger
             WHERE tenant_id = $1`,
            [tenantId]
        );

        return res.rows[0];
    }

    async _getTenantRecentActivity(tenantId) {
        const res = await db.query(
            `SELECT event_type, entity_type, entity_id, metadata, created_at
             FROM audit_logs
             WHERE tenant_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [tenantId]
        );

        return res.rows;
    }
}

module.exports = new AdminDashboardService();

const db = require('../../config/database');
const logger = require('../../utils/logger');

class AnalyticsService {
    /**
     * Get ROI metrics for campaigns
     */
    async getCampaignROI(tenantId) {
        // ROI = (Revenue - Cost) / Cost * 100
        // Revenue = Sum of invoices linked to leads from campaign (simplified)
        // Cost = Campaign budget (if exists) or estimated cost

        // For now, we'll return lead conversion stats as proxy for ROI
        const result = await db.query(
            `SELECT 
                c.id, c.name, 
                COUNT(l.id) as total_leads,
                COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads,
                COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::float / NULLIF(COUNT(l.id), 0) * 100 as conversion_rate
             FROM campaigns c
             LEFT JOIN leads l ON c.id = l.campaign_id
             WHERE c.tenant_id = $1
             GROUP BY c.id, c.name
             ORDER BY conversion_rate DESC`,
            [tenantId]
        );
        return result.rows;
    }

    /**
     * Get Lead Conversion Funnel
     */
    async getConversionFunnel(tenantId) {
        const result = await db.query(
            `SELECT 
                status, 
                COUNT(*) as count 
             FROM leads 
             WHERE tenant_id = $1 
             GROUP BY status 
             ORDER BY count DESC`,
            [tenantId]
        );
        return result.rows;
    }

    /**
     * Get Team Performance Leaderboard
     */
    async getTeamLeaderboard(tenantId) {
        // Metrics: Leads assigned, Leads converted, Avg response time
        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email,
                COUNT(l.id) as assigned_leads,
                COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as conversions,
                COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::float / NULLIF(COUNT(l.id), 0) * 100 as conversion_rate
             FROM users u
             LEFT JOIN leads l ON u.id = l.user_id
             WHERE u.tenant_id = $1
             GROUP BY u.id, u.name, u.email
             ORDER BY conversions DESC`,
            [tenantId]
        );
        return result.rows;
    }

    /**
     * Get Message Volume Trends
     */
    async getMessageVolume(tenantId, days = 30) {
        const result = await db.query(
            `SELECT 
                DATE(created_at) as date,
                channel,
                COUNT(*) as count
             FROM messages
             WHERE tenant_id = $1 
               AND created_at > NOW() - INTERVAL '${days} days'
             GROUP BY DATE(created_at), channel
             ORDER BY date ASC`,
            [tenantId]
        );
        return result.rows;
    }
}

module.exports = new AnalyticsService();

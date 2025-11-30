const db = require('../../config/database');
const logger = require('../../utils/logger');

class CampaignAnalyticsService {
    /**
     * Get campaign performance analytics
     * PRD: Campaign intelligence dashboard
     */
    async getCampaignAnalytics(tenantId, dateRange = {}) {
        try {
            const { from, to } = this._parseDateRange(dateRange);

            const analytics = {
                overview: await this._getOverview(tenantId, from, to),
                campaigns: await this._getCampaigns(tenantId, from, to),
                stages: await this._getStageDistribution(tenantId, from, to),
                channels: await this._getChannelPerformance(tenantId, from, to),
                conversion: await this._getConversionFunnel(tenantId, from, to),
                timeline: await this._getTimelineData(tenantId, from, to)
            };

            return analytics;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to get campaign analytics');
            throw error;
        }
    }

    async _getOverview(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                COUNT(*) as total_leads,
                COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_leads,
                COUNT(*) FILTER (WHERE stage = 'hot') as hot_leads,
                COUNT(*) FILTER (WHERE stage = 'warm') as warm_leads,
                COUNT(*) FILTER (WHERE stage = 'cold') as cold_leads,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
                COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
                AVG(score) as avg_score,
                COUNT(DISTINCT assigned_to) as active_sdrs
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3`,
            [tenantId, from, to]
        );

        const overview = res.rows[0];

        // Calculate conversion rate
        overview.conversion_rate = overview.total_leads > 0
            ? ((overview.converted_leads / overview.total_leads) * 100).toFixed(2)
            : 0;

        // Calculate qualification rate
        overview.qualification_rate = overview.total_leads > 0
            ? ((overview.qualified_leads / overview.total_leads) * 100).toFixed(2)
            : 0;

        return overview;
    }

    async _getCampaigns(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                metadata->>'campaign_name' as name,
                metadata->>'campaign_id' as campaign_id,
                COUNT(*) as uploaded,
                COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
                COUNT(*) FILTER (WHERE stage = 'hot') as hot_leads,
                COUNT(*) FILTER (WHERE stage = 'warm') as warm_leads,
                COUNT(*) FILTER (WHERE stage = 'cold') as cold_leads,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'converted') as converted,
                AVG(score) as avg_score,
                MIN(created_at) as start_date,
                MAX(created_at) as end_date
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3
               AND metadata->>'campaign_name' IS NOT NULL
             GROUP BY metadata->>'campaign_name', metadata->>'campaign_id'
             ORDER BY COUNT(*) DESC`,
            [tenantId, from, to]
        );

        return res.rows.map(campaign => ({
            ...campaign,
            conversion_rate: campaign.uploaded > 0
                ? ((campaign.converted / campaign.uploaded) * 100).toFixed(2)
                : 0,
            qualification_rate: campaign.uploaded > 0
                ? ((campaign.qualified / campaign.uploaded) * 100).toFixed(2)
                : 0
        }));
    }

    async _getStageDistribution(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                stage,
                COUNT(*) as count,
                AVG(score) as avg_score,
                COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3
             GROUP BY stage
             ORDER BY 
                CASE stage
                    WHEN 'hot' THEN 1
                    WHEN 'warm' THEN 2
                    WHEN 'cold' THEN 3
                    ELSE 4
                END`,
            [tenantId, from, to]
        );

        return res.rows;
    }

    async _getChannelPerformance(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                COALESCE(metadata->>'channel', source) as channel,
                COUNT(*) as total_leads,
                COUNT(*) FILTER (WHERE stage = 'hot') as hot_leads,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'converted') as converted,
                AVG(score) as avg_score,
                AVG(EXTRACT(EPOCH FROM (qualified_at - created_at))/3600) as avg_qualification_time_hours
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3
             GROUP BY COALESCE(metadata->>'channel', source)
             ORDER BY COUNT(*) DESC`,
            [tenantId, from, to]
        );

        return res.rows.map(channel => ({
            ...channel,
            conversion_rate: channel.total_leads > 0
                ? ((channel.converted / channel.total_leads) * 100).toFixed(2)
                : 0
        }));
    }

    async _getConversionFunnel(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
                COUNT(*) FILTER (WHERE score IS NOT NULL) as scored,
                COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned,
                COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'converted') as converted
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3`,
            [tenantId, from, to]
        );

        const funnel = res.rows[0];
        const total = parseInt(funnel.total);

        return {
            stages: [
                { name: 'Total Leads', count: total, percentage: 100 },
                { name: 'Verified', count: parseInt(funnel.verified), percentage: total > 0 ? ((funnel.verified / total) * 100).toFixed(1) : 0 },
                { name: 'Scored', count: parseInt(funnel.scored), percentage: total > 0 ? ((funnel.scored / total) * 100).toFixed(1) : 0 },
                { name: 'Assigned', count: parseInt(funnel.assigned), percentage: total > 0 ? ((funnel.assigned / total) * 100).toFixed(1) : 0 },
                { name: 'Contacted', count: parseInt(funnel.contacted), percentage: total > 0 ? ((funnel.contacted / total) * 100).toFixed(1) : 0 },
                { name: 'Qualified', count: parseInt(funnel.qualified), percentage: total > 0 ? ((funnel.qualified / total) * 100).toFixed(1) : 0 },
                { name: 'Converted', count: parseInt(funnel.converted), percentage: total > 0 ? ((funnel.converted / total) * 100).toFixed(1) : 0 }
            ],
            dropoff: {
                verification: total - funnel.verified,
                scoring: funnel.verified - funnel.scored,
                assignment: funnel.scored - funnel.assigned,
                contact: funnel.assigned - funnel.contacted,
                qualification: funnel.contacted - funnel.qualified,
                conversion: funnel.qualified - funnel.converted
            }
        };
    }

    async _getTimelineData(tenantId, from, to) {
        const res = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_leads,
                COUNT(*) FILTER (WHERE stage = 'hot') as hot_leads,
                COUNT(*) FILTER (WHERE stage = 'warm') as warm_leads,
                COUNT(*) FILTER (WHERE stage = 'cold') as cold_leads,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'converted') as converted,
                AVG(score) as avg_score
             FROM leads
             WHERE tenant_id = $1
               AND created_at >= $2
               AND created_at <= $3
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`,
            [tenantId, from, to]
        );

        return res.rows;
    }

    /**
     * Get SDR performance analytics
     */
    async getSDRPerformance(tenantId, dateRange = {}) {
        try {
            const { from, to } = this._parseDateRange(dateRange);

            const res = await db.query(
                `SELECT 
                    u.id as sdr_id,
                    u.name as sdr_name,
                    u.email as sdr_email,
                    COUNT(l.id) as total_leads,
                    COUNT(l.id) FILTER (WHERE l.stage = 'hot') as hot_leads,
                    COUNT(l.id) FILTER (WHERE l.status = 'contacted') as contacted,
                    COUNT(l.id) FILTER (WHERE l.status = 'qualified') as qualified,
                    COUNT(l.id) FILTER (WHERE l.status = 'converted') as converted,
                    AVG(l.score) as avg_lead_score,
                    AVG(EXTRACT(EPOCH FROM (l.first_contact_at - l.assigned_at))/60) as avg_response_time_minutes,
                    COUNT(DISTINCT DATE(l.assigned_at)) as active_days
                 FROM users u
                 JOIN user_metadata um ON u.id = um.user_id
                 LEFT JOIN leads l ON l.assigned_to = u.id 
                    AND l.assigned_at >= $2 
                    AND l.assigned_at <= $3
                 WHERE um.tenant_id = $1 
                   AND um.role = 'sdr'
                 GROUP BY u.id, u.name, u.email
                 ORDER BY COUNT(l.id) FILTER (WHERE l.status = 'converted') DESC`,
                [tenantId, from, to]
            );

            return res.rows.map(sdr => ({
                ...sdr,
                conversion_rate: sdr.total_leads > 0
                    ? ((sdr.converted / sdr.total_leads) * 100).toFixed(2)
                    : 0,
                contact_rate: sdr.total_leads > 0
                    ? ((sdr.contacted / sdr.total_leads) * 100).toFixed(2)
                    : 0,
                qualification_rate: sdr.contacted > 0
                    ? ((sdr.qualified / sdr.contacted) * 100).toFixed(2)
                    : 0
            }));

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to get SDR performance');
            throw error;
        }
    }

    _parseDateRange(dateRange) {
        const to = dateRange.to ? new Date(dateRange.to) : new Date();
        const from = dateRange.from ? new Date(dateRange.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        return { from, to };
    }
}

module.exports = new CampaignAnalyticsService();

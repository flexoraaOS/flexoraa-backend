// Supabase Service
// Handles campaigns, leads, and chat operations
const db = require('../../config/database');
const logger = require('../../utils/logger');

class SupabaseService {
    /**
     * Get active campaigns for a user
     */
    async getActiveCampaigns(userId) {
        try {
            const result = await db.query(
                `SELECT * FROM campaigns 
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to get active campaigns');
            throw error;
        }
    }

    /**
     * Get campaign by ID
     */
    async getCampaign(campaignId) {
        const result = await db.query(
            `SELECT * FROM campaigns WHERE id = $1`,
            [campaignId]
        );
        return result.rows[0];
    }

    /**
     * Get all leads for a user/campaign
     */
    async getLeads(userId, campaignId = null) {
        const query = campaignId
            ? `SELECT * FROM leads WHERE user_id = $1 AND campaign_id = $2 ORDER BY created_at DESC`
            : `SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC`;

        const params = campaignId ? [userId, campaignId] : [userId];
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get lead by phone number
     */
    async getLeadByPhone(phoneNumber) {
        const result = await db.query(
            `SELECT * FROM leads WHERE phone_number = $1 LIMIT 1`,
            [phoneNumber]
        );
        return result.rows[0];
    }

    /**
     * Create new lead
     */
    async createLead(data) {
        const { userId, campaignId, tenantId, phoneNumber, name, metadata = {} } = data;

        const result = await db.query(
            `INSERT INTO leads (user_id, campaign_id, tenant_id, phone_number, name, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [userId, campaignId, tenantId, phoneNumber, name, JSON.stringify(metadata)]
        );

        logger.info({ leadId: result.rows[0].id }, 'Lead created');
        return result.rows[0];
    }

    /**
     * Update lead (status, scoring, assignment)
     */
    async updateLead(leadId, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });

        values.push(leadId);

        const result = await db.query(
            `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        return result.rows[0];
    }

    /**
     * Record consent event (append-only)
     */
    async recordConsent(data) {
        const { tenantId, phoneNumber, email, consentType, consentStatus, consentMethod, ipAddress, rawPayload } = data;

        try {
            const result = await db.query(
                `INSERT INTO consent_log (tenant_id, phone_number, email, consent_type, consent_status, consent_method, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
                [tenantId, phoneNumber, email, consentType, consentStatus, consentMethod, ipAddress, JSON.stringify({ rawPayload })]
            );

            logger.info({ consentId: result.rows[0].id, consentType, consentStatus }, 'Consent recorded');
            return result.rows[0].id;
        } catch (error) {
            logger.error({ err: error }, 'Failed to record consent');
            throw error;
        }
    }

    /**
     * Add assignment to queue
     */
    async createAssignment(leadId, campaignId, tenantId, priority = 0) {
        const result = await db.query(
            `INSERT INTO assignment_queue (lead_id, campaign_id, tenant_id, priority, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [leadId, campaignId, tenantId, priority]
        );

        logger.info({ assignmentId: result.rows[0].id, leadId }, 'Assignment created');
        return result.rows[0];
    }

    /**
     * Assign next lead to SDR
     */
    async assignNextLead(sdrUserId, tenantId) {
        const result = await db.query(
            `SELECT * FROM assign_next_lead_to_sdr($1, $2)`,
            [sdrUserId, tenantId]
        );

        if (!result.rows[0].success) {
            throw new Error(result.rows[0].error_message);
        }

        return {
            assignmentId: result.rows[0].assignment_id,
            leadId: result.rows[0].lead_id,
        };
    }
}

module.exports = new SupabaseService();

// Supabase Service
// Handles campaigns, leads, and chat operations
const db = require('../../config/database');
const logger = require('../../utils/logger');
const encryption = require('../../utils/encryption');

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

        // Decrypt PII
        return result.rows.map(lead => ({
            ...lead,
            phone_number: encryption.decrypt(lead.phone_number)
        }));
    }

    /**
     * Get lead by phone number (using blind index hash)
     */
    async getLeadByPhone(phoneNumber) {
        const phoneHash = encryption.hash(phoneNumber);

        const result = await db.query(
            `SELECT * FROM leads WHERE phone_hash = $1 LIMIT 1`,
            [phoneHash]
        );

        if (!result.rows[0]) return null;

        const lead = result.rows[0];
        lead.phone_number = encryption.decrypt(lead.phone_number);
        return lead;
    }

    /**
     * Get lead by ID
     */
    async getLeadById(leadId) {
        const result = await db.query(
            `SELECT * FROM leads WHERE id = $1 LIMIT 1`,
            [leadId]
        );

        if (!result.rows[0]) return null;

        const lead = result.rows[0];
        lead.phone_number = encryption.decrypt(lead.phone_number);
        return lead;
    }

    /**
     * Create new lead
     */
    async createLead(data) {
        const { userId, campaignId, tenantId, phoneNumber, name, metadata = {} } = data;

        // Encrypt PII
        const encryptedPhone = encryption.encrypt(phoneNumber);
        const phoneHash = encryption.hash(phoneNumber);

        const result = await db.query(
            `INSERT INTO leads (user_id, campaign_id, tenant_id, phone_number, phone_hash, name, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [userId, campaignId, tenantId, encryptedPhone, phoneHash, name, JSON.stringify(metadata)]
        );

        logger.info({ leadId: result.rows[0].id }, 'Lead created');

        // Return decrypted
        const lead = result.rows[0];
        lead.phone_number = encryption.decrypt(lead.phone_number);
        return lead;
    }

    /**
     * Update lead (status, scoring, assignment)
     */
    async updateLead(leadId, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            // Handle PII updates if necessary (though usually phone doesn't change)
            if (key === 'phone_number') {
                fields.push(`phone_number = $${paramCount}`);
                values.push(encryption.encrypt(value));
                paramCount++;

                fields.push(`phone_hash = $${paramCount}`);
                values.push(encryption.hash(value));
                paramCount++;
            } else {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        values.push(leadId);

        const result = await db.query(
            `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (!result.rows[0]) return null;

        const lead = result.rows[0];
        lead.phone_number = encryption.decrypt(lead.phone_number);
        return lead;
    }

    /**
     * Record consent event (append-only)
     */
    async recordConsent(data) {
        const { tenantId, phoneNumber, email, consentType, consentStatus, consentMethod, ipAddress, rawPayload } = data;

        // Encrypt PII
        const encryptedPhone = encryption.encrypt(phoneNumber);
        const phoneHash = encryption.hash(phoneNumber);

        const encryptedEmail = email ? encryption.encrypt(email) : null;
        const emailHash = email ? encryption.hash(email) : null;

        try {
            const result = await db.query(
                `INSERT INTO consent_log (tenant_id, phone_number, phone_hash, email, email_hash, consent_type, consent_status, consent_method, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
                [tenantId, encryptedPhone, phoneHash, encryptedEmail, emailHash, consentType, consentStatus, consentMethod, ipAddress, JSON.stringify({ rawPayload })]
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

    /**
     * Delete lead
     */
    async deleteLead(leadId) {
        const result = await db.query(
            `DELETE FROM leads WHERE id = $1 RETURNING id`,
            [leadId]
        );

        if (result.rows.length === 0) {
            throw new Error('Lead not found');
        }

        logger.info({ leadId }, 'Lead deleted');
        return result.rows[0].id;
    }

    /**
     * Create campaign
     */
    async createCampaign(data) {
        const { userId, tenantId, name, description, status = 'draft', startDate, endDate } = data;

        const result = await db.query(
            `INSERT INTO campaigns (user_id, tenant_id, name, description, status, started_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, tenantId, name, description, status, startDate]
        );

        logger.info({ campaignId: result.rows[0].id }, 'Campaign created');
        return result.rows[0];
    }

    /**
     * Update campaign
     */
    async updateCampaign(campaignId, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });

        values.push(campaignId);

        const result = await db.query(
            `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new Error('Campaign not found');
        }

        return result.rows[0];
    }

    /**
     * Delete campaign
     */
    async deleteCampaign(campaignId) {
        const result = await db.query(
            `DELETE FROM campaigns WHERE id = $1 RETURNING id`,
            [campaignId]
        );

        if (result.rows.length === 0) {
            throw new Error('Campaign not found');
        }

        logger.info({ campaignId }, 'Campaign deleted');
        return result.rows[0].id;
    }
}

module.exports = new SupabaseService();

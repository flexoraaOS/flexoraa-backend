const db = require('../../config/database');
const logger = require('../../utils/logger');
const supabaseService = require('./database/supabaseService');
const instagramService = require('./whatsapp/instagramService');
const facebookService = require('./whatsapp/facebookService');
const { AppError } = require('../../middleware/errorHandler');

class UnifiedInboxService {
    /**
     * Process incoming message from any channel
     * @param {Object} data - Normalized message data
     */
    async processIncomingMessage(data) {
        const {
            channel,
            externalId,
            senderId, // Phone number or Social ID
            senderName,
            content,
            metadata,
            tenantId
        } = data;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Find or Create Lead
            let leadId = await this._findLead(client, channel, senderId, tenantId);

            if (!leadId) {
                leadId = await this._createLeadFromMessage(client, {
                    channel,
                    senderId,
                    senderName,
                    tenantId
                });
            }

            // 2. Store Message
            const messageResult = await client.query(
                `INSERT INTO messages (
                    tenant_id, lead_id, channel, external_id, 
                    direction, sender_id, type, body, metadata
                ) VALUES ($1, $2, $3, $4, 'inbound', $5, $6, $7, $8)
                RETURNING id`,
                [
                    tenantId,
                    leadId,
                    channel,
                    externalId,
                    senderId,
                    content.type || 'text',
                    content.body,
                    JSON.stringify(metadata)
                ]
            );

            await client.query('COMMIT');

            // 3. Trigger Automation (Async)
            const backpressureService = require('./reliability/backpressureService');
            await backpressureService.checkSystemHealth(); // Refresh status

            if (backpressureService.shouldUseTemplatesOnly()) {
                logger.warn({ tenantId }, 'Backpressure: Skipping AI, Template Mode Active');
                // TODO: Send fallback template
            } else {
                // TODO: Trigger n8n workflow or AI response here
            }

            return messageResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, data }, 'Failed to process incoming message');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Send outbound message
     */
    async sendMessage(leadId, channel, content, tenantId) {
        // 1. Get Lead & Channel Info
        const lead = await supabaseService.getLeadById(leadId);
        if (!lead) throw new AppError('Lead not found', 404);

        let externalId;
        if (channel === 'whatsapp') {
            externalId = lead.phone_number; // Decrypted by service
        } else {
            const socialProfile = await this._getSocialProfile(leadId, channel);
            if (!socialProfile) throw new AppError(`No ${channel} profile linked to lead`, 400);
            externalId = socialProfile.platform_user_id;
        }

        // 2. Send via appropriate service
        let providerResponse;
        try {
            switch (channel) {
                case 'instagram':
                    providerResponse = await instagramService.sendText(externalId, content.body);
                    break;
                case 'facebook':
                    providerResponse = await facebookService.sendText(externalId, content.body);
                    break;
                case 'whatsapp':
                    // TODO: Use WhatsApp service
                    break;
                default:
                    throw new AppError('Unsupported channel', 400);
            }
        } catch (error) {
            logger.error({ err: error, leadId, channel }, 'Failed to send outbound message');
            throw error;
        }

        // 3. Store in DB
        await db.query(
            `INSERT INTO messages (
                tenant_id, lead_id, channel, direction, 
                type, body, metadata, status
            ) VALUES ($1, $2, $3, 'outbound', $4, $5, $6, 'sent')`,
            [
                tenantId,
                leadId,
                channel,
                content.type || 'text',
                content.body,
                JSON.stringify({ providerResponse })
            ]
        );

        return { success: true };
    }

    // Private Helpers

    async _findLead(client, channel, senderId, tenantId) {
        if (channel === 'whatsapp') {
            // WhatsApp uses phone number directly
            // Note: In real app, we need to handle encryption/hashing here matching supabaseService
            // For now assuming senderId is raw phone
            const res = await client.query(
                'SELECT id FROM leads WHERE phone_number = $1 AND tenant_id = $2', // In reality, match hash
                [senderId, tenantId] // Placeholder for encryption logic
            );
            return res.rows[0]?.id;
        } else {
            // Social channels use social_profiles table
            const res = await client.query(
                `SELECT lead_id FROM social_profiles 
                 WHERE platform = $1 AND platform_user_id = $2`,
                [channel, senderId]
            );
            return res.rows[0]?.lead_id;
        }
    }

    async _createLeadFromMessage(client, data) {
        const { channel, senderId, senderName, tenantId } = data;

        // 1. Create Lead
        const leadRes = await client.query(
            `INSERT INTO leads (tenant_id, name, source, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [tenantId, senderName || 'Unknown User', channel]
        );
        const leadId = leadRes.rows[0].id;

        // 2. Link Social Profile if needed
        if (channel !== 'whatsapp') {
            await client.query(
                `INSERT INTO social_profiles (lead_id, platform, platform_user_id, username)
                 VALUES ($1, $2, $3, $4)`,
                [leadId, channel, senderId, senderName]
            );
        } else {
            // Update phone for WhatsApp
            // Note: Needs encryption logic
            await client.query(
                'UPDATE leads SET phone_number = $1 WHERE id = $2',
                [senderId, leadId]
            );
        }

        // 3. Audit Log (Async)
        const auditService = require('./compliance/auditService');
        auditService.logEvent(tenantId, 'SYSTEM', 'lead_created', leadId, {
            source: channel,
            senderName
        });

        return leadId;
    }

    async _getSocialProfile(leadId, platform) {
        const res = await db.query(
            'SELECT * FROM social_profiles WHERE lead_id = $1 AND platform = $2',
            [leadId, platform]
        );
        return res.rows[0];
    }
}

module.exports = new UnifiedInboxService();

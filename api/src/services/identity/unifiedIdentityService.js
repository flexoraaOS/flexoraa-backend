// Unified Identity Service
// Merges leads across multiple channels (WhatsApp, Instagram, Facebook, Gmail, Email)
// Creates a single 360° customer profile

const db = require('../../config/database');
const logger = require('../../utils/logger');
const crypto = require('crypto');

class UnifiedIdentityService {
    constructor() {
        // Identity matching strategies
        this.matchingStrategies = [
            'phone_number',
            'email',
            'instagram_username',
            'facebook_id',
            'name_fuzzy_match'
        ];

        // Confidence thresholds
        this.confidenceThresholds = {
            phone_number: 1.0,      // Exact match = 100% confidence
            email: 1.0,             // Exact match = 100% confidence
            instagram_username: 0.95, // Very high confidence
            facebook_id: 1.0,       // Exact match = 100% confidence
            name_fuzzy_match: 0.7   // Lower confidence, needs verification
        };
    }

    /**
     * Find or create unified identity for a lead
     */
    async findOrCreateIdentity(leadData) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Extract identifiers from lead data
            const identifiers = this._extractIdentifiers(leadData);

            // Search for existing identity
            const existingIdentity = await this._findExistingIdentity(client, identifiers);

            if (existingIdentity) {
                // Update existing identity with new data
                await this._updateIdentity(client, existingIdentity.id, leadData, identifiers);
                await client.query('COMMIT');
                
                logger.info({ 
                    identityId: existingIdentity.id, 
                    leadId: leadData.id 
                }, 'Lead linked to existing identity');

                return existingIdentity.id;
            }

            // Create new unified identity
            const identityId = await this._createIdentity(client, leadData, identifiers);
            await client.query('COMMIT');

            logger.info({ identityId, leadId: leadData.id }, 'New unified identity created');

            return identityId;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error }, 'Failed to find or create identity');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Merge two identities (when duplicate detected)
     */
    async mergeIdentities(primaryIdentityId, secondaryIdentityId, reason = 'duplicate_detected') {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Get both identities
            const primary = await client.query(
                'SELECT * FROM unified_identities WHERE id = $1',
                [primaryIdentityId]
            );

            const secondary = await client.query(
                'SELECT * FROM unified_identities WHERE id = $1',
                [secondaryIdentityId]
            );

            if (primary.rows.length === 0 || secondary.rows.length === 0) {
                throw new Error('One or both identities not found');
            }

            // Merge identifiers
            const mergedIdentifiers = this._mergeIdentifierData(
                primary.rows[0].identifiers,
                secondary.rows[0].identifiers
            );

            // Merge metadata
            const mergedMetadata = {
                ...secondary.rows[0].metadata,
                ...primary.rows[0].metadata,
                merged_from: secondaryIdentityId,
                merge_reason: reason,
                merged_at: new Date().toISOString()
            };

            // Update primary identity
            await client.query(
                `UPDATE unified_identities 
                 SET identifiers = $1,
                     metadata = $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [JSON.stringify(mergedIdentifiers), JSON.stringify(mergedMetadata), primaryIdentityId]
            );

            // Update all leads to point to primary identity
            await client.query(
                'UPDATE leads SET unified_identity_id = $1 WHERE unified_identity_id = $2',
                [primaryIdentityId, secondaryIdentityId]
            );

            // Mark secondary identity as merged
            await client.query(
                `UPDATE unified_identities 
                 SET status = 'merged',
                     merged_into = $1,
                     updated_at = NOW()
                 WHERE id = $2`,
                [primaryIdentityId, secondaryIdentityId]
            );

            // Create merge audit log
            await client.query(
                `INSERT INTO identity_merge_log (
                    primary_identity_id, secondary_identity_id, reason, merged_at
                ) VALUES ($1, $2, $3, NOW())`,
                [primaryIdentityId, secondaryIdentityId, reason]
            );

            await client.query('COMMIT');

            logger.info({ 
                primaryIdentityId, 
                secondaryIdentityId, 
                reason 
            }, 'Identities merged successfully');

            return primaryIdentityId;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error }, 'Identity merge failed');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get 360° unified profile for a lead
     */
    async getUnifiedProfile(leadId) {
        try {
            // Get lead's unified identity
            const leadResult = await db.query(
                'SELECT unified_identity_id FROM leads WHERE id = $1',
                [leadId]
            );

            if (leadResult.rows.length === 0) {
                return null;
            }

            const identityId = leadResult.rows[0].unified_identity_id;

            if (!identityId) {
                return null;
            }

            // Get unified identity
            const identityResult = await db.query(
                'SELECT * FROM unified_identities WHERE id = $1',
                [identityId]
            );

            if (identityResult.rows.length === 0) {
                return null;
            }

            const identity = identityResult.rows[0];

            // Get all leads linked to this identity
            const leadsResult = await db.query(
                `SELECT id, name, phone_number, email, channel, status, score, 
                        created_at, last_contacted_at
                 FROM leads 
                 WHERE unified_identity_id = $1
                 ORDER BY created_at DESC`,
                [identityId]
            );

            // Get all messages across channels
            const messagesResult = await db.query(
                `SELECT m.* 
                 FROM messages m
                 JOIN leads l ON l.id = m.lead_id
                 WHERE l.unified_identity_id = $1
                 ORDER BY m.created_at DESC
                 LIMIT 100`,
                [identityId]
            );

            // Get engagement history
            const engagementResult = await db.query(
                `SELECT channel, COUNT(*) as count, MAX(created_at) as last_engagement
                 FROM messages m
                 JOIN leads l ON l.id = m.lead_id
                 WHERE l.unified_identity_id = $1
                 GROUP BY channel`,
                [identityId]
            );

            // Calculate unified score (highest score across all channels)
            const scores = leadsResult.rows.map(l => l.score || 0);
            const unifiedScore = Math.max(...scores, 0);

            // Determine primary channel (most active)
            const channelActivity = {};
            messagesResult.rows.forEach(msg => {
                channelActivity[msg.channel] = (channelActivity[msg.channel] || 0) + 1;
            });
            const primaryChannel = Object.keys(channelActivity).reduce((a, b) => 
                channelActivity[a] > channelActivity[b] ? a : b, 'whatsapp'
            );

            return {
                identityId: identity.id,
                identifiers: identity.identifiers,
                metadata: identity.metadata,
                unifiedScore,
                primaryChannel,
                leads: leadsResult.rows,
                recentMessages: messagesResult.rows.slice(0, 20),
                engagement: engagementResult.rows,
                totalMessages: messagesResult.rows.length,
                channels: [...new Set(leadsResult.rows.map(l => l.channel))],
                firstSeen: leadsResult.rows[leadsResult.rows.length - 1]?.created_at,
                lastSeen: leadsResult.rows[0]?.last_contacted_at,
                status: identity.status
            };

        } catch (error) {
            logger.error({ err: error, leadId }, 'Failed to get unified profile');
            throw error;
        }
    }

    /**
     * Find potential duplicate identities
     */
    async findPotentialDuplicates(tenantId, limit = 50) {
        try {
            // Find identities with similar identifiers
            const result = await db.query(
                `SELECT 
                    i1.id as identity1_id,
                    i2.id as identity2_id,
                    i1.identifiers as identifiers1,
                    i2.identifiers as identifiers2,
                    CASE 
                        WHEN i1.identifiers->>'phone_number' = i2.identifiers->>'phone_number' THEN 1.0
                        WHEN i1.identifiers->>'email' = i2.identifiers->>'email' THEN 1.0
                        WHEN i1.identifiers->>'instagram_username' = i2.identifiers->>'instagram_username' THEN 0.95
                        ELSE 0.7
                    END as confidence
                 FROM unified_identities i1
                 JOIN unified_identities i2 ON i1.id < i2.id
                 WHERE i1.tenant_id = $1 
                   AND i2.tenant_id = $1
                   AND i1.status = 'active'
                   AND i2.status = 'active'
                   AND (
                       i1.identifiers->>'phone_number' = i2.identifiers->>'phone_number'
                       OR i1.identifiers->>'email' = i2.identifiers->>'email'
                       OR i1.identifiers->>'instagram_username' = i2.identifiers->>'instagram_username'
                   )
                 ORDER BY confidence DESC
                 LIMIT $2`,
                [tenantId, limit]
            );

            return result.rows;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to find duplicates');
            throw error;
        }
    }

    /**
     * Extract identifiers from lead data
     */
    _extractIdentifiers(leadData) {
        const identifiers = {};

        // Phone number (normalize to E.164)
        if (leadData.phone_number) {
            identifiers.phone_number = this._normalizePhoneNumber(leadData.phone_number);
        }

        // Email (lowercase)
        if (leadData.email) {
            identifiers.email = leadData.email.toLowerCase().trim();
        }

        // Instagram username
        if (leadData.instagram_username) {
            identifiers.instagram_username = leadData.instagram_username.toLowerCase().replace('@', '');
        }

        // Facebook ID
        if (leadData.facebook_id) {
            identifiers.facebook_id = leadData.facebook_id;
        }

        // Name (for fuzzy matching)
        if (leadData.name) {
            identifiers.name = leadData.name.trim();
            identifiers.name_normalized = this._normalizeName(leadData.name);
        }

        // Generate fingerprint
        identifiers.fingerprint = this._generateFingerprint(identifiers);

        return identifiers;
    }

    /**
     * Find existing identity by identifiers
     */
    async _findExistingIdentity(client, identifiers) {
        // Try exact matches first (phone, email, facebook_id)
        if (identifiers.phone_number) {
            const result = await client.query(
                `SELECT * FROM unified_identities 
                 WHERE identifiers->>'phone_number' = $1 
                   AND status = 'active'
                 LIMIT 1`,
                [identifiers.phone_number]
            );
            if (result.rows.length > 0) return result.rows[0];
        }

        if (identifiers.email) {
            const result = await client.query(
                `SELECT * FROM unified_identities 
                 WHERE identifiers->>'email' = $1 
                   AND status = 'active'
                 LIMIT 1`,
                [identifiers.email]
            );
            if (result.rows.length > 0) return result.rows[0];
        }

        if (identifiers.facebook_id) {
            const result = await client.query(
                `SELECT * FROM unified_identities 
                 WHERE identifiers->>'facebook_id' = $1 
                   AND status = 'active'
                 LIMIT 1`,
                [identifiers.facebook_id]
            );
            if (result.rows.length > 0) return result.rows[0];
        }

        // Try Instagram username (high confidence)
        if (identifiers.instagram_username) {
            const result = await client.query(
                `SELECT * FROM unified_identities 
                 WHERE identifiers->>'instagram_username' = $1 
                   AND status = 'active'
                 LIMIT 1`,
                [identifiers.instagram_username]
            );
            if (result.rows.length > 0) return result.rows[0];
        }

        return null;
    }

    /**
     * Create new unified identity
     */
    async _createIdentity(client, leadData, identifiers) {
        const result = await client.query(
            `INSERT INTO unified_identities (
                tenant_id, identifiers, metadata, status, created_at
            ) VALUES ($1, $2, $3, 'active', NOW())
            RETURNING id`,
            [
                leadData.tenant_id,
                JSON.stringify(identifiers),
                JSON.stringify({
                    primary_name: leadData.name,
                    primary_channel: leadData.channel,
                    first_seen: new Date().toISOString()
                })
            ]
        );

        const identityId = result.rows[0].id;

        // Link lead to identity
        await client.query(
            'UPDATE leads SET unified_identity_id = $1 WHERE id = $2',
            [identityId, leadData.id]
        );

        return identityId;
    }

    /**
     * Update existing identity with new data
     */
    async _updateIdentity(client, identityId, leadData, newIdentifiers) {
        // Get current identifiers
        const current = await client.query(
            'SELECT identifiers FROM unified_identities WHERE id = $1',
            [identityId]
        );

        if (current.rows.length === 0) return;

        // Merge identifiers
        const mergedIdentifiers = this._mergeIdentifierData(
            current.rows[0].identifiers,
            newIdentifiers
        );

        // Update identity
        await client.query(
            `UPDATE unified_identities 
             SET identifiers = $1, updated_at = NOW()
             WHERE id = $2`,
            [JSON.stringify(mergedIdentifiers), identityId]
        );

        // Link lead to identity
        await client.query(
            'UPDATE leads SET unified_identity_id = $1 WHERE id = $2',
            [identityId, leadData.id]
        );
    }

    /**
     * Merge identifier data from two sources
     */
    _mergeIdentifierData(existing, newData) {
        return {
            ...existing,
            ...newData,
            // Keep all unique values
            all_phone_numbers: [...new Set([
                ...(existing.all_phone_numbers || []),
                newData.phone_number
            ].filter(Boolean))],
            all_emails: [...new Set([
                ...(existing.all_emails || []),
                newData.email
            ].filter(Boolean))],
            all_instagram_usernames: [...new Set([
                ...(existing.all_instagram_usernames || []),
                newData.instagram_username
            ].filter(Boolean))]
        };
    }

    /**
     * Normalize phone number to E.164 format
     */
    _normalizePhoneNumber(phone) {
        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, '');

        // Add + if not present
        if (!normalized.startsWith('+')) {
            // Assume India (+91) if no country code
            if (normalized.length === 10) {
                normalized = '+91' + normalized;
            } else {
                normalized = '+' + normalized;
            }
        }

        return normalized;
    }

    /**
     * Normalize name for fuzzy matching
     */
    _normalizeName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    /**
     * Generate fingerprint for identity
     */
    _generateFingerprint(identifiers) {
        const data = [
            identifiers.phone_number,
            identifiers.email,
            identifiers.facebook_id,
            identifiers.instagram_username
        ].filter(Boolean).join('|');

        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

module.exports = new UnifiedIdentityService();

// Meta Messaging Platforms Compliance Service
// Enforces WhatsApp, Instagram, and Facebook Messenger rules
const db = require('../../config/database');
const logger = require('../../utils/logger');

class MetaComplianceService {
    constructor() {
        // WhatsApp Messaging Tiers
        this.whatsappTiers = {
            0: { limit: 1000, requiresVerification: false },
            1: { limit: 10000, requiresVerification: true, minQuality: 3.5 },
            2: { limit: 100000, requiresVerification: true, minQuality: 4.0 },
            3: { limit: 1000000, requiresVerification: true, minQuality: 4.5 }
        };

        // Rate limits
        this.rateLimits = {
            whatsapp: {
                apiCallsPerSecond: 80,
                marketingMessagesPerUser24h: 2
            },
            instagram: {
                dmsPerHour: 200,
                commentOpsPerHour: 200,
                apiCallsPerHour: 200
            },
            facebook: {
                subscriptionMessagesPerUser24h: 1,
                apiCallsPerSecond: 1000,
                apiCallsPerPagePerSecond: 100
            }
        };
    }

    /**
     * Check if WhatsApp message can be sent (24h session window)
     */
    async canSendWhatsAppMessage(leadId, messageType = 'freeform') {
        try {
            const lead = await db.query(
                'SELECT last_customer_message_at, tenant_id FROM leads WHERE id = $1',
                [leadId]
            );

            if (lead.rows.length === 0) {
                return { allowed: false, reason: 'Lead not found' };
            }

            const { last_customer_message_at, tenant_id } = lead.rows[0];

            // Check session window (24 hours)
            if (messageType === 'freeform') {
                if (!last_customer_message_at) {
                    return {
                        allowed: false,
                        reason: 'No customer message received. Must use template.',
                        requiresTemplate: true
                    };
                }

                const hoursSinceLastMessage = (Date.now() - new Date(last_customer_message_at).getTime()) / (1000 * 60 * 60);

                if (hoursSinceLastMessage >= 24) {
                    return {
                        allowed: false,
                        reason: '24-hour session window expired. Must use template.',
                        requiresTemplate: true,
                        hoursExpired: hoursSinceLastMessage - 24
                    };
                }

                return {
                    allowed: true,
                    sessionTimeRemaining: 24 - hoursSinceLastMessage,
                    cost: 0 // User-initiated is free
                };
            }

            // Template message (business-initiated)
            if (messageType === 'template') {
                // Check messaging tier limit
                const tierCheck = await this._checkWhatsAppTierLimit(tenant_id);
                if (!tierCheck.allowed) {
                    return tierCheck;
                }

                // Check marketing message limit (2 per user per 24h)
                if (messageType === 'marketing_template') {
                    const marketingCount = await this._getMarketingMessageCount(leadId, 24);
                    if (marketingCount >= 2) {
                        return {
                            allowed: false,
                            reason: 'Marketing message limit reached (2 per user per 24h)',
                            nextAllowedAt: await this._getNextMarketingSlot(leadId)
                        };
                    }
                }

                return {
                    allowed: true,
                    cost: 0.01, // Business-initiated costs ~$0.01
                    requiresApprovedTemplate: true
                };
            }

        } catch (error) {
            logger.error({ err: error, leadId }, 'WhatsApp compliance check failed');
            return { allowed: false, reason: 'Compliance check error' };
        }
    }

    /**
     * Check WhatsApp messaging tier limit
     */
    async _checkWhatsAppTierLimit(tenantId) {
        try {
            // Get tenant's current tier
            const result = await db.query(
                'SELECT whatsapp_tier, whatsapp_quality_score FROM tenants WHERE id = $1',
                [tenantId]
            );

            if (result.rows.length === 0) {
                return { allowed: false, reason: 'Tenant not found' };
            }

            const { whatsapp_tier = 0, whatsapp_quality_score = 5.0 } = result.rows[0];
            const tierConfig = this.whatsappTiers[whatsapp_tier];

            // Check if verification required
            if (tierConfig.requiresVerification) {
                const verified = await this._isWhatsAppVerified(tenantId);
                if (!verified) {
                    return {
                        allowed: false,
                        reason: 'Identity verification required for this tier',
                        requiresVerification: true
                    };
                }
            }

            // Check quality score
            if (tierConfig.minQuality && whatsapp_quality_score < tierConfig.minQuality) {
                return {
                    allowed: false,
                    reason: `Quality score too low (${whatsapp_quality_score} < ${tierConfig.minQuality})`,
                    currentQuality: whatsapp_quality_score,
                    requiredQuality: tierConfig.minQuality
                };
            }

            // Check 24h conversation limit
            const conversationsToday = await this._getBusinessInitiatedCount(tenantId, 24);
            if (conversationsToday >= tierConfig.limit) {
                return {
                    allowed: false,
                    reason: `Tier ${whatsapp_tier} limit reached (${conversationsToday}/${tierConfig.limit})`,
                    tier: whatsapp_tier,
                    limit: tierConfig.limit,
                    nextResetAt: await this._getNextTierReset(tenantId)
                };
            }

            return {
                allowed: true,
                tier: whatsapp_tier,
                remaining: tierConfig.limit - conversationsToday,
                limit: tierConfig.limit
            };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Tier limit check failed');
            return { allowed: false, reason: 'Tier check error' };
        }
    }

    /**
     * Check if Instagram DM can be sent (engagement-triggered only)
     */
    async canSendInstagramDM(leadId) {
        try {
            // Check if user has engaged (comment, story reply, or previous DM)
            const engagement = await db.query(
                `SELECT engagement_type, engagement_at 
                 FROM instagram_engagements 
                 WHERE lead_id = $1 
                 ORDER BY engagement_at DESC 
                 LIMIT 1`,
                [leadId]
            );

            if (engagement.rows.length === 0) {
                return {
                    allowed: false,
                    reason: 'No engagement trigger. Cold DMs not allowed on Instagram.',
                    requiresEngagement: true
                };
            }

            const { engagement_type, engagement_at } = engagement.rows[0];
            const hoursSinceEngagement = (Date.now() - new Date(engagement_at).getTime()) / (1000 * 60 * 60);

            // Engagement must be within 24h
            if (hoursSinceEngagement >= 24) {
                return {
                    allowed: false,
                    reason: 'Engagement expired (>24h). Need new engagement trigger.',
                    lastEngagement: engagement_type,
                    hoursAgo: hoursSinceEngagement
                };
            }

            // Check rate limit (200 DMs/hour)
            const dmsThisHour = await this._getInstagramDMCount(1);
            if (dmsThisHour >= 200) {
                return {
                    allowed: false,
                    reason: 'Instagram rate limit reached (200 DMs/hour)',
                    current: dmsThisHour,
                    limit: 200,
                    nextSlotAt: await this._getNextInstagramSlot()
                };
            }

            return {
                allowed: true,
                engagementType: engagement_type,
                timeRemaining: 24 - hoursSinceEngagement,
                rateLimit: { current: dmsThisHour, limit: 200 }
            };

        } catch (error) {
            logger.error({ err: error, leadId }, 'Instagram compliance check failed');
            return { allowed: false, reason: 'Compliance check error' };
        }
    }

    /**
     * Check if Facebook Messenger message can be sent
     */
    async canSendFacebookMessage(leadId, messageType = 'user_initiated') {
        try {
            const lead = await db.query(
                'SELECT last_customer_message_at, facebook_opted_in FROM leads WHERE id = $1',
                [leadId]
            );

            if (lead.rows.length === 0) {
                return { allowed: false, reason: 'Lead not found' };
            }

            const { last_customer_message_at, facebook_opted_in } = lead.rows[0];

            // User-initiated (within 24h)
            if (messageType === 'user_initiated') {
                if (!last_customer_message_at) {
                    return { allowed: false, reason: 'No customer message received' };
                }

                const hoursSinceLastMessage = (Date.now() - new Date(last_customer_message_at).getTime()) / (1000 * 60 * 60);

                if (hoursSinceLastMessage >= 24) {
                    return {
                        allowed: false,
                        reason: '24-hour window expired. Use subscription message.',
                        requiresSubscription: true
                    };
                }

                return { allowed: true, sessionTimeRemaining: 24 - hoursSinceLastMessage };
            }

            // Subscription message
            if (messageType === 'subscription') {
                // Check opt-in status
                if (!facebook_opted_in) {
                    return {
                        allowed: false,
                        reason: 'User not opted-in to subscription messages',
                        requiresOptIn: true
                    };
                }

                // Check 1 message per user per 24h limit
                const subscriptionCount = await this._getFacebookSubscriptionCount(leadId, 24);
                if (subscriptionCount >= 1) {
                    return {
                        allowed: false,
                        reason: 'Subscription message limit reached (1 per user per 24h)',
                        nextAllowedAt: await this._getNextFacebookSubscriptionSlot(leadId)
                    };
                }

                return { allowed: true, cost: 0 };
            }

        } catch (error) {
            logger.error({ err: error, leadId }, 'Facebook compliance check failed');
            return { allowed: false, reason: 'Compliance check error' };
        }
    }

    /**
     * Record engagement for Instagram (comment, story reply, mention)
     */
    async recordInstagramEngagement(leadId, engagementType, metadata = {}) {
        try {
            await db.query(
                `INSERT INTO instagram_engagements (lead_id, engagement_type, engagement_at, metadata)
                 VALUES ($1, $2, NOW(), $3)`,
                [leadId, engagementType, JSON.stringify(metadata)]
            );

            logger.info({ leadId, engagementType }, 'Instagram engagement recorded');
        } catch (error) {
            logger.error({ err: error, leadId }, 'Failed to record engagement');
        }
    }

    /**
     * Update WhatsApp quality score
     */
    async updateWhatsAppQualityScore(tenantId, newScore) {
        try {
            const oldScore = await db.query(
                'SELECT whatsapp_quality_score, whatsapp_tier FROM tenants WHERE id = $1',
                [tenantId]
            );

            if (oldScore.rows.length === 0) return;

            const { whatsapp_quality_score: oldQuality, whatsapp_tier: currentTier } = oldScore.rows[0];

            await db.query(
                'UPDATE tenants SET whatsapp_quality_score = $1 WHERE id = $2',
                [newScore, tenantId]
            );

            // Check for tier downgrade
            const tierConfig = this.whatsappTiers[currentTier];
            if (tierConfig.minQuality && newScore < tierConfig.minQuality) {
                await this._downgradeTier(tenantId, currentTier, newScore);
            }

            logger.info({ tenantId, oldQuality, newScore }, 'WhatsApp quality score updated');

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Quality score update failed');
        }
    }

    /**
     * Check template approval status
     */
    async isTemplateApproved(templateName, tenantId) {
        const result = await db.query(
            `SELECT status FROM whatsapp_templates 
             WHERE name = $1 AND tenant_id = $2`,
            [templateName, tenantId]
        );

        if (result.rows.length === 0) {
            return { approved: false, reason: 'Template not found' };
        }

        const { status } = result.rows[0];

        return {
            approved: status === 'approved',
            status,
            reason: status !== 'approved' ? `Template status: ${status}` : null
        };
    }

    // Helper methods
    async _isWhatsAppVerified(tenantId) {
        const result = await db.query(
            'SELECT whatsapp_verified FROM tenants WHERE id = $1',
            [tenantId]
        );
        return result.rows[0]?.whatsapp_verified || false;
    }

    async _getBusinessInitiatedCount(tenantId, hours) {
        const result = await db.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE tenant_id = $1 
               AND direction = 'outbound' 
               AND message_type = 'template'
               AND created_at > NOW() - INTERVAL '${hours} hours'`,
            [tenantId]
        );
        return parseInt(result.rows[0].count);
    }

    async _getMarketingMessageCount(leadId, hours) {
        const result = await db.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE lead_id = $1 
               AND message_type = 'marketing_template'
               AND created_at > NOW() - INTERVAL '${hours} hours'`,
            [leadId]
        );
        return parseInt(result.rows[0].count);
    }

    async _getInstagramDMCount(hours) {
        const result = await db.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE channel = 'instagram' 
               AND direction = 'outbound'
               AND created_at > NOW() - INTERVAL '${hours} hours'`
        );
        return parseInt(result.rows[0].count);
    }

    async _getFacebookSubscriptionCount(leadId, hours) {
        const result = await db.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE lead_id = $1 
               AND message_type = 'subscription'
               AND created_at > NOW() - INTERVAL '${hours} hours'`,
            [leadId]
        );
        return parseInt(result.rows[0].count);
    }

    async _downgradeTier(tenantId, currentTier, qualityScore) {
        const newTier = Math.max(0, currentTier - 1);

        await db.query(
            'UPDATE tenants SET whatsapp_tier = $1 WHERE id = $2',
            [newTier, tenantId]
        );

        // Alert admin
        const emailService = require('../emailService');
        const admins = await db.query(
            "SELECT email FROM users WHERE tenant_id = $1 AND role = 'admin'",
            [tenantId]
        );

        for (const admin of admins.rows) {
            await emailService.sendEmail({
                to: admin.email,
                subject: '⚠️ WhatsApp Tier Downgraded',
                html: `
                    <h2>WhatsApp Messaging Tier Downgrade</h2>
                    <p>Your WhatsApp messaging tier has been downgraded due to low quality score.</p>
                    <p><strong>Previous Tier:</strong> ${currentTier}</p>
                    <p><strong>New Tier:</strong> ${newTier}</p>
                    <p><strong>Quality Score:</strong> ${qualityScore}</p>
                    <p><strong>Action Required:</strong> Improve message quality to regain higher tier.</p>
                `
            });
        }

        logger.warn({ tenantId, currentTier, newTier, qualityScore }, 'WhatsApp tier downgraded');
    }

    async _getNextTierReset(tenantId) {
        // Tier resets every 24h (rolling window)
        const result = await db.query(
            `SELECT MIN(created_at) as oldest 
             FROM messages 
             WHERE tenant_id = $1 
               AND message_type = 'template'
               AND created_at > NOW() - INTERVAL '24 hours'`,
            [tenantId]
        );

        if (!result.rows[0].oldest) {
            return new Date();
        }

        const oldestMessage = new Date(result.rows[0].oldest);
        return new Date(oldestMessage.getTime() + 24 * 60 * 60 * 1000);
    }

    async _getNextMarketingSlot(leadId) {
        const result = await db.query(
            `SELECT MIN(created_at) as oldest 
             FROM messages 
             WHERE lead_id = $1 
               AND message_type = 'marketing_template'
               AND created_at > NOW() - INTERVAL '24 hours'`,
            [leadId]
        );

        if (!result.rows[0].oldest) {
            return new Date();
        }

        const oldestMessage = new Date(result.rows[0].oldest);
        return new Date(oldestMessage.getTime() + 24 * 60 * 60 * 1000);
    }

    async _getNextInstagramSlot() {
        const result = await db.query(
            `SELECT MIN(created_at) as oldest 
             FROM messages 
             WHERE channel = 'instagram' 
               AND direction = 'outbound'
               AND created_at > NOW() - INTERVAL '1 hour'`
        );

        if (!result.rows[0].oldest) {
            return new Date();
        }

        const oldestMessage = new Date(result.rows[0].oldest);
        return new Date(oldestMessage.getTime() + 60 * 60 * 1000);
    }

    async _getNextFacebookSubscriptionSlot(leadId) {
        const result = await db.query(
            `SELECT MIN(created_at) as oldest 
             FROM messages 
             WHERE lead_id = $1 
               AND message_type = 'subscription'
               AND created_at > NOW() - INTERVAL '24 hours'`,
            [leadId]
        );

        if (!result.rows[0].oldest) {
            return new Date();
        }

        const oldestMessage = new Date(result.rows[0].oldest);
        return new Date(oldestMessage.getTime() + 24 * 60 * 60 * 1000);
    }
}

module.exports = new MetaComplianceService();

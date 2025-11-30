const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Subscription-based Feature Gating Middleware
 * LeadOS Only (₹2,499): WhatsApp only, no profile merging
 * AgentOS Only (₹4,999): Multi-channel, unified profiles
 * Full OS (₹7,499): Everything + predictive scoring
 */

const PLANS = {
    'leadso_only': {
        name: 'LeadOS Only',
        price: 2499,
        features: ['whatsapp', 'basic_scoring']
    },
    'agentos_only': {
        name: 'AgentOS Only',
        price: 4999,
        features: ['whatsapp', 'instagram', 'facebook', 'gmail', 'unified_profile', 'basic_scoring']
    },
    'full_os': {
        name: 'Full OS',
        price: 7499,
        features: ['whatsapp', 'instagram', 'facebook', 'gmail', 'unified_profile', 'basic_scoring', 'predictive_scoring', 'advanced_analytics']
    }
};

async function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

            if (!tenantId) {
                return res.status(400).json({ error: 'Tenant ID required' });
            }

            // Get tenant's subscription
            const subscription = await getTenantSubscription(tenantId);

            if (!subscription) {
                return res.status(403).json({
                    error: 'No active subscription',
                    message: 'Please subscribe to a plan to access this feature'
                });
            }

            const plan = PLANS[subscription.plan_id];
            if (!plan) {
                return res.status(500).json({ error: 'Invalid subscription plan' });
            }

            // Check if plan includes the required feature
            if (!plan.features.includes(featureName)) {
                return res.status(403).json({
                    error: 'Feature not available in your plan',
                    feature: featureName,
                    currentPlan: plan.name,
                    message: `This feature requires ${getRequiredPlan(featureName)} or higher`
                });
            }

            // Attach subscription info to request
            req.subscription = {
                planId: subscription.plan_id,
                planName: plan.name,
                features: plan.features
            };

            next();

        } catch (error) {
            logger.error({ err: error, featureName }, 'Feature gating failed');
            next(error);
        }
    };
}

async function getTenantSubscription(tenantId) {
    try {
        const res = await db.query(
            `SELECT plan_id, status FROM subscriptions 
             WHERE tenant_id = $1 AND status = 'active'
             ORDER BY created_at DESC
             LIMIT 1`,
            [tenantId]
        );
        return res.rows[0];
    } catch (error) {
        logger.error({ err: error, tenantId }, 'Failed to get tenant subscription');
        return null;
    }
}

function getRequiredPlan(featureName) {
    for (const [planId, plan] of Object.entries(PLANS)) {
        if (plan.features.includes(featureName)) {
            return plan.name;
        }
    }
    return 'Full OS';
}

/**
 * Channel-specific gating
 */
function requireChannel(channel) {
    const channelFeatureMap = {
        'whatsapp': 'whatsapp',
        'instagram': 'instagram',
        'facebook': 'facebook',
        'gmail': 'gmail'
    };

    return requireFeature(channelFeatureMap[channel]);
}

module.exports = {
    requireFeature,
    requireChannel,
    PLANS
};

const tokenService = require('../services/payment/tokenService');
const logger = require('../utils/logger');

/**
 * Token Enforcement Middleware
 * Deducts tokens based on operation type (Rate Card from PRD)
 */
const tokenCosts = {
    'lead_verification': 0.5,
    'lead_scoring': 0.5,
    'whatsapp_inbound': 0.1,
    'ai_classification': 1.0,
    'ai_qualification': 2.0,
    'ai_persuasion': 3.0,
    'cold_recovery': 2.5,
    'escalation_decision': 0.5,
    'appointment_booking': 1.0,
    'routing_decision': 1.0,
    'social_media_inbound': 0.2,
    'high_risk_review': 5.0
};

async function enforceTokenCost(operationType) {
    return async (req, res, next) => {
        try {
            const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

            if (!tenantId) {
                return res.status(400).json({ error: 'Tenant ID required' });
            }

            const cost = tokenCosts[operationType];
            if (!cost) {
                logger.warn({ operationType }, 'Unknown operation type for token cost');
                return next();
            }

            // Check balance first
            const balance = await tokenService.getBalance(tenantId);
            if (balance.balance < cost) {
                return res.status(402).json({
                    error: 'Insufficient tokens',
                    required: cost,
                    available: balance.balance,
                    message: 'Please top up your token balance to continue'
                });
            }

            // Attach cost to request for later deduction
            req.tokenCost = {
                amount: cost,
                operation: operationType,
                tenantId
            };

            next();

        } catch (error) {
            logger.error({ err: error, operationType }, 'Token enforcement failed');
            next(error);
        }
    };
}

/**
 * Post-request token deduction
 * Call this in response handlers after successful operation
 */
async function deductTokenAfterSuccess(req, description, referenceId) {
    if (req.tokenCost) {
        try {
            await tokenService.deductTokens(
                req.token Cost.tenantId,
                req.tokenCost.amount,
                req.tokenCost.operation,
                description,
                referenceId
            );
        } catch (error) {
            logger.error({ err: error }, 'Post-operation token deduction failed');
        }
    }
}

module.exports = {
    enforceTokenCost,
    deductTokenAfterSuccess,
    tokenCosts
};

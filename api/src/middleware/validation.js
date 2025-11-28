/**
 * Input Validation Middleware using Joi
 * 
 * FIXES: HIGH #5 - Missing input schema validation
 * 
 * Provides schema-based validation for all endpoints
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validate request against Joi schema
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just first
            stripUnknown: true // Remove unknown properties
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            logger.warn('Validation failed', {
                traceId: req.id,
                endpoint: req.path,
                errors
            });

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace request property with validated/sanitized value
        req[property] = value;
        next();
    };
}

/**
 * Common validation schemas
 */
const schemas = {
    // Lead webhook schema
    leadosWebhook: Joi.object({
        user_id: Joi.string().required().max(255),
        name: Joi.string().max(255),
        description: Joi.string().max(1000),
        phone_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
    }),

    // WhatsApp webhook schema
    whatsappWebhook: Joi.object({
        object: Joi.string().valid('whatsapp_business_account'),
        entry: Joi.array().items(
            Joi.object({
                id: Joi.string(),
                changes: Joi.array().items(
                    Joi.object({
                        field: Joi.string(),
                        value: Joi.object()
                    })
                )
            })
        )
    }),

    // KlickTipp webhook schema
    klicktippWebhook: Joi.object({
        subscriber_id: Joi.string().required(),
        email: Joi.string().email(),
        phone: Joi.string(),
        custom_fields: Joi.object()
    }),

    // Lead assignment schema
    leadAssignment: Joi.object({
        lead_id: Joi.string().uuid().required(),
        agent_id: Joi.string().uuid().required()
    }),

    // Pagination schema
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    })
};

module.exports = {
    validate,
    schemas
};

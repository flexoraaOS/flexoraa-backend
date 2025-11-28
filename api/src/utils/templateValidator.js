const logger = require('../../utils/logger');

/**
 * WhatsApp Template Validator
 * Validates template parameters before sending to Meta API
 */

// Template schemas
const TEMPLATE_SCHEMAS = {
    'offer_for_manual': {
        language: 'de',
        bodyParams: 3, // FirstName, Product, Company
        buttonParams: 1, // URL suffix
        required: true
    },
    'auto_forward_to_support': {
        language: 'de',
        bodyParams: 1, // Contact name
        buttonParams: 0,
        required: true
    }
};

/**
 * Validate template parameters
 * @param {string} templateName - Template name without language
 * @param {Object} parameters - Parameters object
 * @returns {Object} Validation result
 */
function validateTemplateParameters(templateName, parameters) {
    const schema = TEMPLATE_SCHEMAS[templateName];

    if (!schema) {
        return {
            valid: false,
            error: `Unknown template: ${templateName}`
        };
    }

    // Validate body parameters
    const bodyParams = parameters.body || [];
    if (bodyParams.length !== schema.bodyParams) {
        return {
            valid: false,
            error: `Template ${templateName} requires ${schema.bodyParams} body parameters, got ${bodyParams.length}`
        };
    }

    // Validate button parameters
    if (schema.buttonParams > 0 && !parameters.button) {
        return {
            valid: false,
            error: `Template ${templateName} requires button parameter`
        };
    }

    // Validate parameter types
    for (const param of bodyParams) {
        if (typeof param !== 'string' && typeof param !== 'number') {
            return {
                valid: false,
                error: `Invalid parameter type: ${typeof param} (expected string or number)`
            };
        }
    }

    return { valid: true };
}

/**
 * Pre-validate template before sending
 * @param {string} template - Template string (e.g., "offer_for_manual|de")
 * @param {Object} parameters - Parameters object
 * @throws {Error} If validation fails
 */
function preValidateTemplate(template, parameters) {
    if (!template || typeof template !== 'string') {
        throw new Error('Template must be a non-empty string');
    }

    const [templateName, language] = template.split('|');

    if (!templateName) {
        throw new Error('Template name missing');
    }

    const validation = validateTemplateParameters(templateName, parameters);

    if (!validation.valid) {
        logger.error('Template validation failed', {
            template: templateName,
            error: validation.error,
            parameters
        });
        throw new Error(`Template validation failed: ${validation.error}`);
    }

    logger.debug('Template validation passed', { template: templateName });
    return true;
}

module.exports = {
    validateTemplateParameters,
    preValidateTemplate,
    TEMPLATE_SCHEMAS
};

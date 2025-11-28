/**
 * WhatsApp Template Parameter Validator
 * Validates template parameters before sending to Meta WhatsApp API
 * Prevents API rejections and provides clear error messages
 * 
 * @module utils/templateValidator
 */

const logger = require('./logger');

/**
 * WhatsApp template schemas defining required parameters
 * @constant
 * @type {Object.<string, {language: string, bodyParams: number, buttonParams: number, required: boolean}>}
 */
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
 * Validate template parameters against schema
 * 
 * @param {string} templateName - Template name without language code
 * @param {Object} parameters - Template parameters object
 * @param {Array<string|number>} [parameters.body=[]] - Body parameter values
 * @param {string} [parameters.button] - Button parameter value
 * @returns {{valid: boolean, error?: string}} Validation result
 * 
 * @example
 * const validation = validateTemplateParameters('offer_for_manual', {
 *   body: ['John', 'Product X', 'Company Y'],
 *   button: 'discount123'
 * });
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 */
function validateTemplateParameters(templateName, parameters) {
    if (!templateName || typeof templateName !== 'string') {
        return {
            valid: false,
            error: 'Template name must be a non-empty string'
        };
    }

    if (!parameters || typeof parameters !== 'object') {
        return {
            valid: false,
            error: 'Parameters must be an object'
        };
    }

    const schema = TEMPLATE_SCHEMAS[templateName];

    if (!schema) {
        return {
            valid: false,
            error: `Unknown template: ${templateName}. Available templates: ${Object.keys(TEMPLATE_SCHEMAS).join(', ')}`
        };
    }

    // Validate body parameters
    const bodyParams = parameters.body || [];
    if (!Array.isArray(bodyParams)) {
        return {
            valid: false,
            error: 'Body parameters must be an array'
        };
    }

    if (bodyParams.length !== schema.bodyParams) {
        return {
            valid: false,
            error: `Template "${templateName}" requires ${schema.bodyParams} body parameters, got ${bodyParams.length}`
        };
    }

    // Validate button parameters
    if (schema.buttonParams > 0 && !parameters.button) {
        return {
            valid: false,
            error: `Template "${templateName}" requires button parameter`
        };
    }

    // Validate parameter types
    for (const [index, param] of bodyParams.entries()) {
        if (param === null || param === undefined) {
            return {
                valid: false,
                error: `Body parameter at index ${index} is null or undefined`
            };
        }

        if (typeof param !== 'string' && typeof param !== 'number') {
            return {
                valid: false,
                error: `Body parameter at index ${index} has invalid type: ${typeof param} (expected string or number)`
            };
        }
    }

    return { valid: true };
}

/**
 * Pre-validate template before sending to WhatsApp API
 * Throws descriptive error if validation fails
 * 
 * @param {string} template - Template string in format "name|language" (e.g., "offer_for_manual|de")
 * @param {Object} parameters - Template parameters
 * @throws {Error} If template validation fails
 * @returns {boolean} True if validation passes
 * 
 * @example
 * try {
 *   preValidateTemplate('offer_for_manual|de', {
 *     body: ['John', 'Product', 'Company'],
 *     button: 'promo123'
 *   });
 *   // Proceed with API call
 * } catch (error) {
 *   // Handle validation error
 * }
 */
function preValidateTemplate(template, parameters) {
    if (!template || typeof template !== 'string') {
        throw new Error('Template must be a non-empty string in format "name|language"');
    }

    const [templateName, language] = template.split('|');

    if (!templateName) {
        throw new Error('Template name missing from template string');
    }

    if (!language) {
        logger.warn('Template language code missing, will use default', { template });
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

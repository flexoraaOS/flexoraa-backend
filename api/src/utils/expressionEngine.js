/**
 * Expression Engine
 * Implements n8n expression evaluation:
 * - {{ $json.field }} - Access current item JSON
 * - {{ $node["NodeName"].json.field }} - Access other node data
 * - Template interpolation
 * 
 * Note: This is a simplified version. Full n8n expression engine is more complex.
 */

/**
 * Evaluate n8n-style expression
 * @param {string} expression - Expression like "={{ $json.name }}"
 * @param {object} context - Context object with current data
 * @returns {string} Evaluated result
 */
function evaluateExpression(expression, context = {}) {
    if (!expression) return '';

    // Check if it's an n8n expression (starts with ={{)
    if (!expression.startsWith('={{') && !expression.includes('{{')) {
        return expression; // Plain string, return as-is
    }

    try {
        // Remove ={{ and }} wrappers
        let cleaned = expression.trim();
        if (cleaned.startsWith('={{')) {
            cleaned = cleaned.slice(3, -2).trim();
        }

        // Simple variable replacement
        cleaned = cleaned.replace(/\$json\.([a-zA-Z0-9_\[\]\.]+)/g, (match, path) => {
            return getNestedValue(context.$json || context, path);
        });

        // Node reference: $('NodeName').item.json.field
        cleaned = cleaned.replace(/\$\('([^']+)'\)\.item\.json\.([a-zA-Z0-9_\[\]\.]+)/g, (match, nodeName, path) => {
            const nodeData = context.$nodes?.[nodeName] || {};
            return getNestedValue(nodeData, path);
        });

        // Handle body.field syntax
        cleaned = cleaned.replace(/\$json\.body\.([a-zA-Z0-9_]+)/g, (match, field) => {
            return context.$json?.body?.[field] || context.body?.[field] || '';
        });

        return cleaned;

    } catch (error) {
        console.error('Expression evaluation error', { error, expression });
        return expression; // Return original on error
    }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    if (!obj) return '';

    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
        // Handle array access: field[0]
        const arrayMatch = part.match(/([a-zA-Z0-9_]+)\[(\d+)\]/);
        if (arrayMatch) {
            const [, field, index] = arrayMatch;
            value = value?.[field]?.[parseInt(index)];
        } else {
            value = value?.[part];
        }

        if (value === undefined) return '';
    }

    return value !== undefined ? String(value) : '';
}

/**
 * Interpolate template with context
 * Handles multiple {{ }} within a string
 */
function interpolateTemplate(template, context) {
    if (!template) return '';

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
        return evaluateExpression(`={{${expr}}}`, context);
    });
}

module.exports = {
    evaluateExpression,
    interpolateTemplate,
    getNestedValue
};

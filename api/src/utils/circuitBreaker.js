// Circuit Breaker Utility
// Wraps external service calls to prevent cascading failures
const CircuitBreaker = require('opossum');
const logger = require('./logger');

const options = {
    timeout: 5000, // If function takes longer than 5 seconds, trigger failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
    resetTimeout: 30000 // Wait 30 seconds before trying again
};

/**
 * Create a circuit breaker for a function
 * @param {Function} asyncFunction - The async function to wrap
 * @param {string} name - Name for logging
 * @param {Object} customOptions - Override default options
 */
const createBreaker = (asyncFunction, name = 'default', customOptions = {}) => {
    const breaker = new CircuitBreaker(asyncFunction, { ...options, ...customOptions });

    breaker.fallback(() => {
        logger.warn({ service: name }, 'Circuit breaker open - fallback triggered');
        return {
            error: 'Service temporarily unavailable',
            fallback: true,
            mode: 'circuit-breaker'
        };
    });

    breaker.on('open', () => {
        logger.warn({ service: name }, '🔴 Circuit breaker OPENED');
    });

    breaker.on('halfOpen', () => {
        logger.info({ service: name }, '🟡 Circuit breaker HALF-OPEN');
    });

    breaker.on('close', () => {
        logger.info({ service: name }, '🟢 Circuit breaker CLOSED');
    });

    return breaker;
};

module.exports = {
    createCircuitBreaker: createBreaker,
    createBreaker
};

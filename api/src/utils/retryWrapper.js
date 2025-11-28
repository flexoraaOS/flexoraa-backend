/**
 * Retry Wrapper with Exponential Backoff
 * Implements production-grade retry logic for external API calls
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function or throws after max retries
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        backoffMultiplier = 2,
        retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Rate limit'],
        onRetry = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const isRetryable = retryableErrors.some(err =>
                error.message?.includes(err) ||
                error.code?.includes(err) ||
                error.status === 429 || // Rate limit
                error.status === 503 || // Service unavailable
                error.status === 504    // Gateway timeout
            );

            // Don't retry if not retriable or max retries reached
            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                initialDelayMs * Math.pow(backoffMultiplier, attempt),
                maxDelayMs
            );

            // Add jitter (±25%)
            const jitter = delay * 0.25 * (Math.random() - 0.5);
            const finalDelay = delay + jitter;

            // Call onRetry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, finalDelay, error);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
    }

    throw lastError;
}

/**
 * Create a retryable version of a function
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Retry options
 * @returns {Function} Wrapped function with retry logic
 */
function withRetry(fn, options = {}) {
    return async (...args) => {
        return retryWithBackoff(() => fn(...args), options);
    };
}

module.exports = {
    retryWithBackoff,
    withRetry
};

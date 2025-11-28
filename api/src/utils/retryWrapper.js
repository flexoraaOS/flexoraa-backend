/**
 * Retry Wrapper with Exponential Backoff
 * Implements production-grade retry logic for external API calls
 * 
 * @module utils/retryWrapper
 */

/**
 * Retry a function with exponential backoff and jitter
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} [options={}] - Retry configuration options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelayMs=1000] - Initial delay in milliseconds
 * @param {number} [options.maxDelayMs=10000] - Maximum delay in milliseconds
 * @param {number} [options.backoffMultiplier=2] - Backoff multiplier for exponential growth
 * @param {string[]} [options.retryableErrors] - Array of error messages/codes to retry on
 * @param {Function} [options.onRetry=null] - Callback function called on each retry attempt
 * @returns {Promise<*>} Result of the function or throws after max retries
 * @throws {Error} Last error encountered after exhausting all retries
 * 
 * @example
 * const result = await retryWithBackoff(
 *   async () => await externalAPI.call(),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, delay, error) => console.log(`Retry ${attempt}`)
 *   }
 * );
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

            // Add jitter (±25%) to prevent thundering herd
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
 * 
 * @param {Function} fn - Function to wrap with retry logic
 * @param {Object} [options={}] - Retry configuration options (see retryWithBackoff)
 * @returns {Function} Wrapped function with automatic retry capability
 * 
 * @example
 * const reliableAPICall = withRetry(myAPICall, { maxRetries: 5 });
 * const result = await reliableAPICall(param1, param2);
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

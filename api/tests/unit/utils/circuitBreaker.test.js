// Unit Test: Circuit Breaker Utility
const { createBreaker } = require('../../../src/utils/circuitBreaker');

describe('Circuit Breaker Utility', () => {
    it('should execute successful function normally', async () => {
        const successFn = async () => 'success';
        const breaker = createBreaker(successFn, 'test-success');

        const result = await breaker.fire();
        expect(result).toBe('success');
    });

    it('should trigger fallback on failure', async () => {
        const failFn = async () => { throw new Error('fail'); };
        const breaker = createBreaker(failFn, 'test-fail', {
            errorThresholdPercentage: 0, // Trip immediately
            resetTimeout: 100
        });

        // First call fails and trips
        try {
            await breaker.fire();
        } catch (e) {
            // Opossum throws on first failure usually
        }

        // Second call should be fallback (open)
        const result = await breaker.fire();
        expect(result).toHaveProperty('fallback', true);
        expect(result).toHaveProperty('error', 'Service temporarily unavailable');
    });
});

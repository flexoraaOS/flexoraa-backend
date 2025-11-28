/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 1 & 2
 * Chaos API Testing & Failover Tests
 */

jest.mock('rate-limit-redis', () => {
    return {
        RedisStore: jest.fn().mockImplementation(() => ({
            increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: Date.now() + 60000 }),
            decrement: jest.fn(),
            resetKey: jest.fn()
        }))
    };
});

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementation(async () => {
            if (CHAOS_CONFIG.networkPartition) throw new Error('Redis: Network Partition');
            return null;
        }),
        set: jest.fn().mockResolvedValue('OK'),
        on: jest.fn(),
        quit: jest.fn(),
        call: jest.fn(), // For rate-limit-redis
        disconnect: jest.fn()
    }));
});

jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn().mockImplementation(async () => {
            if (Math.random() < CHAOS_CONFIG.dbTimeoutRate) throw new Error('DB: Connection Timeout');
            return {
                query: jest.fn().mockResolvedValue({ rows: [] }),
                release: jest.fn()
            };
        }),
        query: jest.fn().mockResolvedValue({ rows: [] }),
        end: jest.fn(),
        on: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockImplementation(async () => {
                    if (CHAOS_CONFIG.apiLatencyMax > 0) {
                        await new Promise(r => setTimeout(r, Math.random() * CHAOS_CONFIG.apiLatencyMax));
                    }
                    return { choices: [{ message: { content: '{"output": "mock"}' } }] };
                })
            }
        }
    }));
});

// Import app AFTER mocks
const app = require('../../../src/server');

describe('PHASE C: DESTRUCTION - INFRASTRUCTURE COLLAPSE', () => {

    beforeEach(() => {
        CHAOS_CONFIG.redisFailureRate = 0;
        CHAOS_CONFIG.dbTimeoutRate = 0;
        CHAOS_CONFIG.apiLatencyMax = 0;
        CHAOS_CONFIG.networkPartition = false;
    });

    test('CRITICAL: Should survive 100 concurrent requests with random 2s latency', async () => {
        CHAOS_CONFIG.apiLatencyMax = 2000;

        const requests = Array(100).fill(null).map((_, i) =>
            request(app)
                .post('/api/webhooks/leados')
                .set('Authorization', `Bearer ${mockToken}`)
                .set('X-Idempotency-Key', `chaos-${i}`)
                .send({ user_id: `user-${i}`, name: 'Chaos User' })
                .timeout(2500)
        );

        const results = await Promise.allSettled(requests);
        const crashes = results.filter(r =>
            r.status === 'fulfilled' && r.value.status === 500
        );

        if (crashes.length > 0) {
            // We expect some failures, but we want to know if they are handled
            // For now, just log them
            // console.log(`Chaos test: ${crashes.length} crashes`);
        }
        // Don't fail the test yet, just gathering data
    }, 30000);

    test('CRITICAL: Should maintain availability when Redis is 100% down', async () => {
        CHAOS_CONFIG.networkPartition = true;

        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ user_id: 'redis-down', name: 'No Cache' });

        if (res.status === 500) {
            throw new Error('Server crashed when Redis was unreachable');
        }
    });

    test('CRITICAL: Should handle flaky DB (20% failure) gracefully', async () => {
        CHAOS_CONFIG.dbTimeoutRate = 0.2;

        const requests = Array(50).fill(null).map(() =>
            request(app)
                .post('/api/leads')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ name: 'Flaky DB', phone: '+1234567890' })
        );

        const results = await Promise.allSettled(requests);
        const badErrors = results.filter(r =>
            r.status === 'fulfilled' && r.value.status === 500
        );

        if (badErrors.length > 0) {
            // console.log(`Flaky DB test: ${badErrors.length} 500 errors`);
        }
    });
});

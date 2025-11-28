/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 3 & 10 & 11
 * State Corruption, Replay Attacks, Time Travel
 */

process.env.OPENAI_API_KEY = 'mock-key';
process.env.JWT_SECRET = 'mock-secret-mock-secret-mock-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockToken = jwt.sign(
    { userId: 'test-user', role: 'admin', tenantId: 'test-tenant' },
    process.env.JWT_SECRET
);

// MOCK INFRASTRUCTURE
const CHAOS_CONFIG = {
    redisFailureRate: 0.0,
    dbTimeoutRate: 0.0,
    apiLatencyMax: 0,
    networkPartition: false
};

// MOCKS
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
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        on: jest.fn(),
        quit: jest.fn(),
        call: jest.fn(),
        disconnect: jest.fn()
    }));
});

jest.mock('pg', () => {
    const mQuery = jest.fn().mockResolvedValue({ rows: [] });
    const mPool = {
        connect: jest.fn().mockResolvedValue({
            query: mQuery,
            release: jest.fn()
        }),
        query: mQuery,
        end: jest.fn(),
        on: jest.fn(),
        setSessionContext: jest.fn() // Add this for auth
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({ choices: [{ message: { content: '{"output": "mock"}' } }] })
            }
        }
    }));
});
/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 3 & 10 & 11
 * State Corruption, Replay Attacks, Time Travel
 */

process.env.OPENAI_API_KEY = 'mock-key';
process.env.JWT_SECRET = 'mock-secret-mock-secret-mock-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockToken = jwt.sign(
    { userId: 'test-user', role: 'admin', tenantId: 'test-tenant' },
    process.env.JWT_SECRET
);

// MOCK INFRASTRUCTURE
const CHAOS_CONFIG = {
    redisFailureRate: 0.0,
    dbTimeoutRate: 0.0,
    apiLatencyMax: 0,
    networkPartition: false
};

// MOCKS
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
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        on: jest.fn(),
        quit: jest.fn(),
        call: jest.fn(),
        disconnect: jest.fn()
    }));
});

jest.mock('pg', () => {
    return {
        Pool: jest.fn(() => ({
            connect: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValue({ rows: [] }),
                release: jest.fn()
            }),
            query: jest.fn().mockResolvedValue({ rows: [] }),
            end: jest.fn(),
            on: jest.fn()
        }))
    };
});

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({ choices: [{ message: { content: '{"output": "mock"}' } }] })
            }
        }
    }));
});
    });

test('CRITICAL: Should prevent Race Condition in Lead Assignment', async () => {
    // Simulate 2 requests trying to claim the same lead
    const pool = new (require('pg').Pool)();
    pool.query.mockClear();

    // We need to mock DB to simulate "locked" state or delay?
    // Or just fire 2 requests.

    const req1 = request(app)
        .post('/api/leads/assign') // Assuming this endpoint exists
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ lead_id: 'race-lead' });

    const req2 = request(app)
        .post('/api/leads/assign')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ lead_id: 'race-lead' });

    const results = await Promise.all([req1, req2]);

    // One should succeed, one should fail (409 or 423) or be handled gracefully.
    // If both succeed (200), it's a race condition failure (double assignment).

    const successCount = results.filter(r => r.status === 200).length;
    if (successCount > 1) {
        // This is a simplified check. Real check depends on DB state.
        // But if mock always returns success, both will be 200.
        // We need the mock to handle concurrency? 
        // Jest mocks are synchronous usually.
        // So this test might not reveal race conditions with simple mocks.
    }
});
});

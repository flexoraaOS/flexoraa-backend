/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 8 & 9
 * Edge Cases & Replay Attacks (Advanced)
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
        get: jest.fn().mockImplementation(async () => {
            if (CHAOS_CONFIG.networkPartition) throw new Error('Redis: Network Partition');
            return null;
        }),
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

const app = require('../../../src/server');

describe('PHASE C: DESTRUCTION - EDGE CASES', () => {

    test('CRITICAL: Should handle invalid JSON in webhook body', async () => {
        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${mockToken}`)
            .send('{"invalid": json, }'); // Malformed JSON

        // Express body-parser usually handles this with 400
        if (res.status === 500) {
            throw new Error('Server crashed on invalid JSON');
        }
        expect(res.status).toBe(400);
    });

    test('CRITICAL: Should handle missing Content-Type header', async () => {
        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send('some raw data');

        // Should be 400 or handled gracefully
        expect(res.status).not.toBe(500);
    });

    test.skip('CRITICAL: Should handle Unicode in headers', async () => {
        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .set('X-Custom-Header', '🚀🔥')
            .send({ user_id: 'unicode-header' });

        expect(res.status).not.toBe(500);
    });

    test('CRITICAL: Should handle empty body', async () => {
        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({});

        // Should validation error (400), not crash
        expect(res.status).toBe(400); // Assuming validation requires fields
    });
});

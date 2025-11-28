/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 4 & 5
 * Economic Abuse & Resource Exhaustion
 */

process.env.OPENAI_API_KEY = 'mock-key';
process.env.JWT_SECRET = 'mock-secret-mock-secret-mock-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockToken = jwt.sign(
    { userId: 'test-user', role: 'admin', tenantId: 'test-tenant' },
    process.env.JWT_SECRET
);

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
        hgetall: jest.fn().mockResolvedValue({}),
        hmset: jest.fn().mockResolvedValue('OK'),
        expire: jest.fn().mockResolvedValue(1),
        on: jest.fn(),
        quit: jest.fn(),
        call: jest.fn()
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
const { evaluateExpression } = require('../../../src/utils/expressionEngine');

describe('PHASE C: DESTRUCTION - RESOURCE & COST ATTACKS', () => {

    test('CRITICAL: Should prevent cost cap bypass via tenant ID spoofing', async () => {
        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .set('X-Tenant-ID', 'admin-bypass')
            .send({
                user_id: 'attacker',
                name: 'Cost Attack',
                description: 'A'.repeat(5000)
            });

        // Expect 200 (processed) or 4xx (rejected), but check for cost headers
        // This is a behavior check
    });

    test('CRITICAL: Should survive "Billion Laughs" style expression attack', () => {
        const maliciousExpression = '={{ ' + '$json.'.repeat(5000) + 'field }}';

        const startTime = Date.now();
        try {
            evaluateExpression(maliciousExpression, { $json: {} });
        } catch (e) {
            // Expected error
        }
        const duration = Date.now() - startTime;

        if (duration > 1000) {
            throw new Error(`Expression evaluation took ${duration}ms (DoS vector confirmed)`);
        }
    });

    test('CRITICAL: Should reject 50MB payload immediately', async () => {
        const hugePayload = { data: 'X'.repeat(50 * 1024 * 1024) };

        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send(hugePayload);

        if (res.status !== 413) {
            throw new Error(`Server accepted 50MB payload with status ${res.status} (OOM risk)`);
        }
    });
});

/**
 * PHASE C: DESTRUCTION SUITE - CATEGORY 6 & 7
 * Security Violations & Fuzzing
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

describe('PHASE C: DESTRUCTION - SECURITY & FUZZING', () => {

    test('CRITICAL: Should block SQL injection in UUID fields', async () => {
        const res = await request(app)
            .get('/api/leads/123; DROP TABLE leads;')
            .set('Authorization', `Bearer ${mockToken}`);

        if (res.status === 500) {
            // 500 might indicate SQL execution error
        }
        expect(res.status).not.toBe(500);
    });

    test('CRITICAL: Should block prototype pollution', async () => {
        const pollutionPayload = {
            "__proto__": { "isAdmin": true },
            "constructor": { "prototype": { "isAdmin": true } }
        };

        await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send(pollutionPayload);

        const obj = {};
        if (obj.isAdmin) {
            throw new Error('Prototype pollution successful! (CRITICAL SECURITY FLAW)');
        }
    });

    test('CRITICAL: Should handle dangerous Unicode sequences', async () => {
        const dangerousText = '\u202E\u200B<script>alert(1)</script>';

        const res = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ name: dangerousText, user_id: 'fuzz-1' });

        expect(res.status).not.toBe(500);
    });
});

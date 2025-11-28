/**
 * PHASE C: DESTRUCTION SUITE - MOCK SETUP
 * 
 * Mocks infrastructure to simulate catastrophic failures:
 * - Redis: Random latency, connection drops, memory limits
 * - Postgres: Deadlocks, timeouts, connection pool exhaustion
 * - OpenAI: Rate limits, malformed responses, infinite delays
 * - WhatsApp: Delivery failures, duplicate hooks, invalid signatures
 */

const Redis = require('ioredis');
const { Pool } = require('pg');
const OpenAI = require('openai');

// CHAOS CONFIGURATION
const CHAOS_CONFIG = {
    redisFailureRate: 0.0,
    dbTimeoutRate: 0.0,
    apiLatencyMax: 0,
    networkPartition: false,
    clockSkewMs: 0
};

// MOCK REDIS
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockImplementation(async (key) => {
            if (CHAOS_CONFIG.networkPartition) throw new Error('Redis: Network Partition');
            if (Math.random() < CHAOS_CONFIG.redisFailureRate) throw new Error('Redis: Connection Lost');
            return null;
        }),
        set: jest.fn().mockImplementation(async () => {
            if (CHAOS_CONFIG.networkPartition) throw new Error('Redis: Network Partition');
            if (Math.random() < CHAOS_CONFIG.redisFailureRate) throw new Error('Redis: Connection Lost');
            return 'OK';
        }),
        on: jest.fn(),
        quit: jest.fn()
    }));
});

// MOCK POSTGRES
jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn().mockImplementation(async () => {
            if (Math.random() < CHAOS_CONFIG.dbTimeoutRate) throw new Error('DB: Connection Timeout');
            return {
                query: jest.fn().mockResolvedValue({ rows: [] }),
                release: jest.fn()
            };
        }),
        query: jest.fn().mockImplementation(async () => {
            if (Math.random() < CHAOS_CONFIG.dbTimeoutRate) throw new Error('DB: Query Timeout');
            return { rows: [] };
        }),
        end: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
});

// MOCK OPENAI
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

module.exports = { CHAOS_CONFIG };

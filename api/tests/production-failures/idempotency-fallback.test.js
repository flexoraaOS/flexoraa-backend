/**
 * PRODUCTION FAILURE TEST - Idempotency Fallback
 * 
 * Reproduces: CRITICAL #1 from Phase A
 * Issue: No Redis fallback for idempotency causes duplicate processing
 * 
 * Expected behavior:
 * - Primary: Store idempotency in Redis (fast)
 * - Fallback: If Redis unavailable, use DB (slower but reliable)
 * - Result: No duplicates even during Redis outage
 */

const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/database');
const Redis = require('ioredis');

describe('Production Failure - Idempotency Fallback', () => {
    let redis;

    beforeAll(() => {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    });

    afterAll(async () => {
        await redis.quit();
        await db.end();
    });

    beforeEach(async () => {
        // Clear test data
        await redis.flushdb();
        await db.query('DELETE FROM idempotency_cache WHERE key LIKE \'test-%\'');
    });

    /**
     * TEST 1: Normal operation - Redis available
     * Should use Redis for fast idempotency check
     */
    test('should use Redis for idempotency when available', async () => {
        const idempotencyKey = `test-redis-${Date.now()}`;
        const payload = { user_id: 'test-user', name: 'Test Lead' };

        // First request
        const res1 = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', 'Bearer test-token')
            .set('X-Idempotency-Key', idempotencyKey)
            .send(payload);

        expect(res1.status).toBe(200);

        // Verify stored in Redis
        const cached = await redis.get(`idempotency:${idempotencyKey}`);
        expect(cached).toBeDefined();

        // Second request (duplicate)
        const res2 = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', 'Bearer test-token')
            .set('X-Idempotency-Key', idempotencyKey)
            .send(payload);

        expect(res2.status).toBe(200);
        expect(res2.body).toEqual(res1.body);

        // Verify only ONE lead created
        const leads = await db.query(
            'SELECT COUNT(*) FROM leads WHERE name = $1',
            ['Test Lead']
        );
        expect(parseInt(leads.rows[0].count)).toBe(1);
    });

    /**
     * TEST 2: Redis outage - DB fallback
     * THIS TEST CURRENTLY FAILS - demonstrates the bug
     */
    test('should fallback to DB when Redis unavailable', async () => {
        const idempotencyKey = `test-fallback-${Date.now()}`;
        const payload = { user_id: 'test-user', name: 'Fallback Test' };

        // Simulate Redis outage
        await redis.disconnect();

        // First request (Redis down, should use DB)
        const res1 = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', 'Bearer test-token')
            .set('X-Idempotency-Key', idempotencyKey)
            .send(payload);

        expect(res1.status).toBe(200);

        // Verify stored in DB fallback
        const dbCached = await db.query(
            'SELECT * FROM idempotency_cache WHERE key = $1',
            [`idempotency:${idempotencyKey}`]
        );
        expect(dbCached.rows.length).toBe(1);

        // Second request (should return cached from DB)
        const res2 = await request(app)
            .post('/api/webhooks/leados')
            .set('Authorization', 'Bearer test-token')
            .set('X-Idempotency-Key', idempotencyKey)
            .send(payload);

        expect(res2.status).toBe(200);
        expect(res2.body).toEqual(res1.body);

        // Verify only ONE lead created (no duplicates)
        const leads = await db.query(
            'SELECT COUNT(*) FROM leads WHERE name = $1',
            ['Fallback Test']
        );
        expect(parseInt(leads.rows[0].count)).toBe(1);

        // Reconnect Redis for other tests
        await redis.connect();
    });

    /**
     * TEST 3: Concurrent duplicates with Redis down
     * Fire 10 identical requests simultaneously during Redis outage
     * Should handle race condition with DB locks
     */
    test('should handle concurrent duplicates with DB fallback', async () => {
        const idempotencyKey = `test-concurrent-${Date.now()}`;
        const payload = { user_id: 'test-user', name: 'Concurrent Test' };

        // Disconnect Redis
        await redis.disconnect();

        // Fire 10 concurrent identical requests
        const promises = Array(10).fill(null).map(() =>
            request(app)
                .post('/api/webhooks/leados')
                .set('Authorization', 'Bearer test-token')
                .set('X-Idempotency-Key', idempotencyKey)
                .send(payload)
        );

        const results = await Promise.all(promises);

        // All should succeed
        expect(results.every(r => r.status === 200)).toBe(true);

        // All should return identical response
        const bodies = results.map(r => JSON.stringify(r.body));
        expect(new Set(bodies).size).toBe(1);

        // Verify only ONE lead created
        const leads = await db.query(
            'SELECT COUNT(*) FROM leads WHERE name = $1',
            ['Concurrent Test']
        );
        expect(parseInt(leads.rows[0].count)).toBe(1);

        // Verify only ONE DB cache entry
        const cacheEntries = await db.query(
            'SELECT COUNT(*) FROM idempotency_cache WHERE key = $1',
            [`idempotency:${idempotencyKey}`]
        );
        expect(parseInt(cacheEntries.rows[0].count)).toBe(1);

        await redis.connect();
    }, 30000); // 30s timeout
});

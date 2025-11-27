// Sample Unit Test: Health Endpoint
const request = require('supertest');
const app = require('../../../src/app');

describe('Health Endpoint', () => {
    describe('GET /health', () => {
        it('should return 200 OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status');
        });

        it('should include service health checks', async () => {
            const res = await request(app).get('/health');
            expect(res.body).toHaveProperty('services');
            expect(res.body.services).toHaveProperty('database');
            expect(res.body.services).toHaveProperty('redis');
        });
    });

    describe('GET /health/ready', () => {
        it('should return readiness status', async () => {
            const res = await request(app).get('/health/ready');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('ready');
        });
    });

    describe('GET /health/live', () => {
        it('should return liveness', async () => {
            const res = await request(app).get('/health/live');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('alive', true);
        });
    });
});

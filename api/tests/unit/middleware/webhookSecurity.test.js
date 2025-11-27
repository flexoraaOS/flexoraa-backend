// Unit Test: Webhook Security Middleware
const { preventReplay } = require('../../../src/middleware/webhookSecurity');
const { redis } = require('../../../src/middleware/rateLimiter');

// Mock Redis
jest.mock('../../../src/middleware/rateLimiter', () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
    }
}));

const mockLogger = require('../../../src/utils/logger');
jest.mock('../../../src/utils/logger');

describe('Webhook Security Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            ip: '127.0.0.1',
            path: '/webhook'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should proceed if no nonce header is present', async () => {
        await preventReplay(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(redis.get).not.toHaveBeenCalled();
    });

    it('should allow new request with unique nonce', async () => {
        req.headers['x-request-id'] = 'unique-id-123';
        redis.get.mockResolvedValue(null); // Not found

        await preventReplay(req, res, next);

        expect(redis.get).toHaveBeenCalledWith('nonce:unique-id-123');
        expect(redis.set).toHaveBeenCalledWith('nonce:unique-id-123', '1', 'EX', 900);
        expect(next).toHaveBeenCalled();
    });

    it('should reject replay request (nonce exists)', async () => {
        req.headers['x-request-id'] = 'replayed-id-123';
        redis.get.mockResolvedValue('1'); // Found

        await preventReplay(req, res, next);

        expect(redis.get).toHaveBeenCalledWith('nonce:replayed-id-123');
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate request detected' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should prioritize X-Hub-Signature over X-Request-ID', async () => {
        req.headers['x-hub-signature'] = 'sig-123';
        req.headers['x-request-id'] = 'req-456';
        redis.get.mockResolvedValue(null);

        await preventReplay(req, res, next);

        expect(redis.get).toHaveBeenCalledWith('nonce:sig-123');
    });

    it('should fail open on Redis error', async () => {
        req.headers['x-request-id'] = 'error-test';
        redis.get.mockRejectedValue(new Error('Redis down'));

        await preventReplay(req, res, next);

        expect(next).toHaveBeenCalled(); // Should proceed despite error
        expect(mockLogger.error).toHaveBeenCalled();
    });
});

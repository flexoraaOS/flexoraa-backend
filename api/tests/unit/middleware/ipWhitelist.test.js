// Unit Test: IP Whitelist Middleware
const ipWhitelist = require('../../../src/middleware/ipWhitelist');
const config = require('../../../src/config/env');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger');

describe('IP Whitelist Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            ip: '127.0.0.1',
            path: '/admin'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should allow access if whitelist is empty', () => {
        config.ADMIN_ALLOWLIST_IPS = '';
        const middleware = ipWhitelist();
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should allow access if IP is in whitelist', () => {
        config.ADMIN_ALLOWLIST_IPS = '127.0.0.1,192.168.1.1';
        const middleware = ipWhitelist();
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should deny access if IP is not in whitelist', () => {
        config.ADMIN_ALLOWLIST_IPS = '192.168.1.1'; // Localhost not included
        const middleware = ipWhitelist();
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle IPv6 mapped IPv4 addresses', () => {
        config.ADMIN_ALLOWLIST_IPS = '127.0.0.1';
        req.ip = '::ffff:127.0.0.1';

        const middleware = ipWhitelist();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

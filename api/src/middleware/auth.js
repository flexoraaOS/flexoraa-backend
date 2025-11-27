// Authentication Middleware
// JWT + API Key + RBAC
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Verify JWT token
 */
const verifyJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            tenantId: decoded.tenantId,
        };

        // Set session context for RLS
        await db.setSessionContext(null, decoded.userId, 'api');

        next();
    } catch (error) {
        logger.error({ err: error }, 'JWT verification failed');
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Verify API Key (for webhooks)
 */
const verifyAPIKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ error: 'No API key provided' });
        }

        // Lookup API key in database
        const result = await db.query(
            `SELECT id, role, tenant_id FROM users WHERE api_key_hash = crypt($1, api_key_hash)`,
            [apiKey]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        req.user = {
            id: result.rows[0].id,
            role: result.rows[0].role,
            tenantId: result.rows[0].tenant_id,
        };

        next();
    } catch (error) {
        logger.error({ err: error }, 'API key verification failed');
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Check user role (RBAC)
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn({ userId: req.user.id, role: req.user.role, required: allowedRoles }, 'Access denied');
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Optional authentication (continues even without token)
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // No auth provided, continue
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            tenantId: decoded.tenantId,
        };
    } catch (error) {
        // Invalid token, but continue anyway (optional auth)
        logger.debug('Optional auth: invalid token');
    }

    next();
};

module.exports = {
    verifyJWT,
    verifyAPIKey,
    requireRole,
    optionalAuth,
};

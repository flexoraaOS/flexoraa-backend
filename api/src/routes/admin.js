// Admin Routes
// Protected by IP Whitelist and RBAC
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/admin/stats
 * System-wide statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const leadsCount = await db.query('SELECT COUNT(*) FROM leads');
    const campaignsCount = await db.query('SELECT COUNT(*) FROM campaigns');

    res.json({
        users: parseInt(usersCount.rows[0].count),
        leads: parseInt(leadsCount.rows[0].count),
        campaigns: parseInt(campaignsCount.rows[0].count),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
}));

/**
 * POST /api/admin/cache/clear
 * Clear Redis cache
 */
router.post('/cache/clear', asyncHandler(async (req, res) => {
    const redis = require('../middleware/rateLimiter').redis;
    await redis.flushdb();
    logger.info('Redis cache cleared by admin');
    res.json({ success: true, message: 'Cache cleared' });
}));

/**
 * POST /api/admin/toggles/disable-ai
 * Emergency kill-switch to disable all AI calls globally
 */
router.post('/toggles/disable-ai', asyncHandler(async (req, res) => {
    const { disabled } = req.body;
    const redis = require('../middleware/rateLimiter').redis;

    if (disabled) {
        await redis.set('ai:emergency_disabled', '1');
        logger.warn('AI emergency kill-switch ACTIVATED by admin');
        res.json({ success: true, message: 'AI disabled globally', aiEnabled: false });
    } else {
        await redis.del('ai:emergency_disabled');
        logger.info('AI emergency kill-switch DEACTIVATED by admin');
        res.json({ success: true, message: 'AI re-enabled globally', aiEnabled: true });
    }
}));

/**
 * GET /api/admin/toggles/ai-status
 * Check if AI is currently enabled or disabled
 */
router.get('/toggles/ai-status', asyncHandler(async (req, res) => {
    const redis = require('../middleware/rateLimiter').redis;
    const disabled = await redis.get('ai:emergency_disabled');

    res.json({
        aiEnabled: !disabled,
        emergencyMode: !!disabled
    });
}));

module.exports = router;

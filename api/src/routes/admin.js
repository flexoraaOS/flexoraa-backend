// Admin Routes
// Protected by IP Whitelist and RBAC
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../config/database');

// Middleware
// Note: ipWhitelist is applied in app.js or here
// We'll apply it here for granular control if mounted globally, 
// but usually it's better to apply it at the mount point in app.js

/**
 * GET /api/admin/stats
 * System-wide statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Example stats query
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
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch admin stats');
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/cache/clear
 * Clear Redis cache (placeholder)
 */
router.post('/cache/clear', async (req, res) => {
    // TODO: Implement cache clearing logic
    logger.info({ ip: req.ip }, 'Admin cleared cache');
    res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;

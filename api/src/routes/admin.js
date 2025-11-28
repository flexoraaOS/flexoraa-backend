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
        memory: process.memoryUsage()
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

/**
 * POST /api/admin/users/invite
 * Invite a new user via email
 */
router.post('/users/invite', asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const emailService = require('../services/emailService');
    const crypto = require('crypto');

    // 1. Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // 2. Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const inviteLink = `${process.env.DOMAIN || 'http://localhost:3000'}/auth/accept-invite?token=${token}`;

    // 3. Store invite (assuming an invites table exists, or just log for now)
    // For MVP, we'll just send the link. In production, store in 'invites' table.
    // await db.query('INSERT INTO invites ...');

    // 4. Send Email
    await emailService.sendInvitation(email, inviteLink);

    res.json({ success: true, message: 'Invitation sent', inviteLink }); // Return link for testing
}));

/**
 * PATCH /api/admin/users/:id/role
 * Update user role
 */
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    if (!['admin', 'sdr', 'manager', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);

    logger.info({ adminId: req.user.id, targetUserId: id, newRole: role }, 'User role updated');
    res.json({ success: true });
}));

module.exports = router;

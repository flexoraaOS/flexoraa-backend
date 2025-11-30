const express = require('express');
const router = express.Router();
const adminDashboardService = require('../services/admin/adminDashboardService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/admin/overview
 * Get admin dashboard overview
 * Frontend: /dashboard/admin-dashboard
 */
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const overview = await adminDashboardService.getOverview();

        res.json({
            success: true,
            overview
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get admin overview');
        res.status(500).json({
            error: 'Failed to get admin overview',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/tenants/:tenantId
 * Get tenant details
 */
router.get('/tenants/:tenantId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tenantId } = req.params;

        const details = await adminDashboardService.getTenantDetails(tenantId);

        res.json({
            success: true,
            tenant: details
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get tenant details');
        res.status(500).json({
            error: 'Failed to get tenant details',
            message: error.message
        });
    }
});

/**
 * PUT /api/admin/tenants/:tenantId/status
 * Update tenant status
 */
router.put('/tenants/:tenantId/status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await db.query(
            `UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, tenantId]
        );

        res.json({
            success: true,
            message: `Tenant status updated to ${status}`
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to update tenant status');
        res.status(500).json({
            error: 'Failed to update tenant status',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/tenants/:tenantId/tokens/credit
 * Credit tokens to tenant (admin action)
 */
router.post('/tenants/:tenantId/tokens/credit', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { tokens, reason } = req.body;
        const { userId } = req.user;

        if (!tokens || tokens <= 0) {
            return res.status(400).json({ error: 'Invalid token amount' });
        }

        const tokenService = require('../services/payment/tokenService');
        await tokenService.creditTokens(
            tenantId,
            tokens,
            'admin_credit',
            `Admin credit: ${reason || 'Manual adjustment'}`,
            { credited_by: userId }
        );

        res.json({
            success: true,
            message: `Credited ${tokens} tokens to tenant`
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to credit tokens');
        res.status(500).json({
            error: 'Failed to credit tokens',
            message: error.message
        });
    }
});

module.exports = router;

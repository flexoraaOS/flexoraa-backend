// Audit Routes
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const auditService = require('../services/audit/auditService');

/**
 * GET /api/audit/:leadId
 * Get audit trail for a specific lead
 */
router.get(
    '/:leadId',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { limit } = req.query;

        const trail = await auditService.getAuditTrail(req.params.leadId, {
            limit: limit ? parseInt(limit) : 50
        });

        res.json({ trail });
    })
);

/**
 * GET /api/audit
 * Get recent audit events (admin only)
 */
router.get(
    '/',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { limit, action } = req.query;

        const events = await auditService.getRecentAudit({
            limit: limit ? parseInt(limit) : 100,
            action
        });

        res.json({ events });
    })
);

module.exports = router;

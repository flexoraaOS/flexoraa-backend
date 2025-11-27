// Leads Router
const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { tenantLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const supabaseService = require('../services/database/supabaseService');

/**
 * GET /api/leads
 * List all leads for authenticated user
 */
router.get(
    '/',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const { campaign_id } = req.query;
        const leads = await supabaseService.getLeads(req.user.id, campaign_id);
        res.json({ leads });
    })
);

/**
 * GET /api/leads/:id
 * Get specific lead
 */
router.get(
    '/:id',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const lead = await supabaseService.getLeadByPhone(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check ownership
        if (lead.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json({ lead });
    })
);

module.exports = router;

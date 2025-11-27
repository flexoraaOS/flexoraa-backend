// Campaigns Router
const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { tenantLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const supabaseService = require('../services/database/supabaseService');

/**
 * GET /api/campaigns
 * List all campaigns for authenticated user
 */
router.get(
    '/',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const campaigns = await supabaseService.getActiveCampaigns(req.user.id);
        res.json({ campaigns });
    })
);

/**
 * GET /api/campaigns/:id
 * Get specific campaign
 */
router.get(
    '/:id',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const campaign = await supabaseService.getCampaign(req.params.id);

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Check ownership
        if (campaign.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json({ campaign });
    })
);

module.exports = router;

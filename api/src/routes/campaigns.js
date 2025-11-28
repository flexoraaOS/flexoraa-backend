// Campaigns Router
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { tenantLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const supabaseService = require('../services/database/supabaseService');
const { validate, createCampaignSchema, updateCampaignSchema } = require('../validation/schemas');

/**
 * GET /api/campaigns
 * List all campaigns for authenticated user (matching frontend fetchCampaigns)
 */
router.get(
    '/',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const campaigns = await supabaseService.getActiveCampaigns(req.user.id);
        // Return array directly (frontend expects Campaign[])
        res.json(campaigns);
    })
);

/**
 * POST /api/campaigns
 * Create new campaign (matching frontend createCampaign)
 */
router.post(
    '/',
    verifyJWT,
    tenantLimiter,
    validate(createCampaignSchema),
    asyncHandler(async (req, res) => {
        const { name, description, start_date, end_date, status } = req.body;

        const campaign = await supabaseService.createCampaign({
            userId: req.user.id,
            tenantId: req.user.tenant_id,
            name,
            description,
            status: status || 'draft',
            startDate: start_date,
            endDate: end_date
        });

        res.status(201).json(campaign);
    })
);

/**
 * PATCH /api/campaigns/:id
 * Update campaign (matching frontend updateCampaign)
 */
router.patch(
    '/:id',
    verifyJWT,
    tenantLimiter,
    validate(updateCampaignSchema),
    asyncHandler(async (req, res) => {
        const updates = req.body;

        const campaign = await supabaseService.updateCampaign(req.params.id, updates);

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    })
);

/**
 * DELETE /api/campaigns/:id
 * Delete campaign (matching frontend deleteCampaign)
 */
router.delete(
    '/:id',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        await supabaseService.deleteCampaign(req.params.id);
        res.status(204).send();
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

        res.json(campaign);
    })
);

module.exports = router;

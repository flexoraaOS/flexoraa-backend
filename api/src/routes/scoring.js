// Lead Scoring Routes
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const scoringService = require('../services/scoring/scoringService');
const supabaseService = require('../services/database/supabaseService');

/**
 * GET /api/leads/:id/score
 * Calculate and return lead score
 */
router.get(
    '/:id/score',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { includeAI } = req.query;

        // Get lead data
        const lead = await supabaseService.getLeadById(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check ownership
        if (lead.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Calculate score
        const scoreResult = await scoringService.scoreLead(lead, {
            includeAI: includeAI !== 'false' // Default true
        });

        // Optionally update lead metadata with score
        if (req.query.save === 'true') {
            const metadata = lead.metadata || {};
            metadata.last_score = scoreResult;

            await supabaseService.updateLead(req.params.id, { metadata });
        }

        res.json(scoreResult);
    })
);

/**
 * POST /api/scoring/batch
 * Score multiple leads in batch
 */
router.post(
    '/batch',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { leadIds, includeAI } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds array required' });
        }

        // Fetch all leads (with ownership check)
        const leads = [];
        for (const id of leadIds) {
            const lead = await supabaseService.getLeadById(id);
            if (lead && lead.user_id === req.user.id) {
                leads.push(lead);
            }
        }

        // Score all leads
        const scores = await scoringService.scoreLeads(leads, {
            includeAI: includeAI !== false
        });

        res.json({ scores });
    })
);

module.exports = router;

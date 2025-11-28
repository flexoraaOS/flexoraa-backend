// Leads Router
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { tenantLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const supabaseService = require('../services/database/supabaseService');
const { validate, createLeadSchema, updateLeadSchema } = require('../validation/schemas');
const { getMessageHistory } = require('../lib/meta-api');

/**
 * GET /api/leads?campaignId=&userId=&limit=
 * List all leads for authenticated user (matching frontend fetchLeads)
 */
router.get(
    '/',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const { campaignId, userId, limit } = req.query;

        // Use authenticated user's ID unless explicitly provided (admin override)
        const effectiveUserId = userId || req.user.id;

        const leads = await supabaseService.getLeads(
            effectiveUserId,
            campaignId || null,
            limit ? parseInt(limit) : undefined
        );

        // Return array directly (frontend expects Campaign[])
        res.json(leads);
    })
);

/**
 * POST /api/leads
 * Create new lead (matching frontend createLead)
 */
router.post(
    '/',
    verifyJWT,
    tenantLimiter,
    validate(createLeadSchema),
    asyncHandler(async (req, res) => {
        const { phone_number, name, campaign_id, metadata, email, tags, has_whatsapp, stage, status } = req.body;

        const lead = await supabaseService.createLead({
            userId: req.user.id,
            campaignId: campaign_id,
            tenantId: req.user.tenant_id,
            phoneNumber: phone_number,
            name,
            metadata,
        });

        // Update additional fields if provided
        if (email || tags || has_whatsapp !== undefined || stage || status) {
            const updates = {};
            if (email) updates.email = email;
            if (tags) updates.tags = tags;
            if (has_whatsapp !== undefined) updates.has_whatsapp = has_whatsapp;
            if (stage) updates.stage = stage;
            if (status) updates.status = status;

            const updatedLead = await supabaseService.updateLead(lead.id, updates);
            return res.status(201).json(updatedLead);
        }

        res.status(201).json(lead);
    })
);

/**
 * PATCH /api/leads/:id
 * Update lead (matching frontend updateLead, updateLeadStage, addNote, etc.)
 */
router.patch(
    '/:id',
    verifyJWT,
    tenantLimiter,
    validate(updateLeadSchema),
    asyncHandler(async (req, res) => {
        const updates = req.body;

        // Special handling: if stage === 'converted', set closed = true
        if (updates.stage && String(updates.stage).toLowerCase() === 'converted') {
            updates.closed = true;
        }

        const lead = await supabaseService.updateLead(req.params.id, updates);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        res.json(lead);
    })
);

/**
 * DELETE /api/leads/:id
 * Delete lead (matching frontend deleteLead)
 */
router.delete(
    '/:id',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        await supabaseService.deleteLead(req.params.id);
        res.status(204).send();
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
        const lead = await supabaseService.getLeadById(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check ownership
        if (lead.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(lead);
    })
);

/**
 * GET /api/leads/:leadId/messages
 * Get message history for a lead (matching frontend getMessageHistory)
 */
router.get(
    '/:leadId/messages',
    verifyJWT,
    tenantLimiter,
    asyncHandler(async (req, res) => {
        const { limit } = req.query;
        // This would need to be implemented in supabaseService or meta-api
        // For now, return empty array
        const messages = await getMessageHistory(
            req.user.id,
            req.params.leadId,
            limit ? parseInt(limit) : 50
        );
        res.json(messages);
    })
);

module.exports = router;

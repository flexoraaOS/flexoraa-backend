// Assignment Routes
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const supabaseService = require('../services/database/supabaseService');
const auditService = require('../services/audit/auditService');

/**
 * POST /api/assignments/claim
 * Claim next available lead from assignment queue (with optimistic locking)
 */
router.post(
    '/claim',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const sdrUserId = req.user.id;
        const tenantId = req.user.tenant_id;

        try {
            const result = await supabaseService.assignNextLead(sdrUserId, tenantId);

            if (!result || !result.assignmentId) {
                return res.status(404).json({ error: 'No assignments available' });
            }

            // Log audit
            await auditService.logLeadAssigned(
                result.leadId,
                sdrUserId,
                result.assignmentId,
                req.user.email,
                req.ip
            );

            res.json({
                success: true,
                assignmentId: result.assignmentId,
                leadId: result.leadId
            });
        } catch (error) {
            if (error.message.includes('version')) {
                return res.status(409).json({ error: 'Assignment already claimed by another SDR' });
            }
            throw error;
        }
    })
);

/**
 * GET /api/assignments/my-leads
 * Get all leads assigned to current SDR
 */
router.get(
    '/my-leads',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const leads = await supabaseService.getLeads(req.user.id);
        res.json(leads);
    })
);

module.exports = router;

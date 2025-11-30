// GDPR Compliance Routes
const express = require('express');
const router = express.Router();
const gdprService = require('../services/compliance/gdprService');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * POST /api/compliance/gdpr/deletion-request
 * Create GDPR deletion request
 */
router.post('/gdpr/deletion-request', async (req, res, next) => {
    try {
        const { leadId, requestorEmail, reason } = req.body;

        const result = await gdprService.createDeletionRequest(leadId, requestorEmail, reason);

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/compliance/gdpr/approve/:requestId
 * Approve deletion request (manager only)
 */
router.post('/gdpr/approve/:requestId', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const { notes } = req.body;

        const result = await gdprService.approveDeletionRequest(
            req.params.requestId,
            req.user.id,
            notes
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/compliance/gdpr/reject/:requestId
 * Reject deletion request (manager only)
 */
router.post('/gdpr/reject/:requestId', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const { reason } = req.body;

        const result = await gdprService.rejectDeletionRequest(
            req.params.requestId,
            req.user.id,
            reason
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/compliance/gdpr/requests
 * Get deletion requests for tenant
 */
router.get('/gdpr/requests', authenticate, async (req, res, next) => {
    try {
        const { status } = req.query;

        const requests = await gdprService.getDeletionRequests(req.user.tenant_id, status);

        res.json(requests);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/compliance/gdpr/export/:leadId
 * Export lead data (GDPR data portability)
 */
router.get('/gdpr/export/:leadId', async (req, res, next) => {
    try {
        const { email } = req.query;

        const data = await gdprService.exportLeadData(req.params.leadId, email);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

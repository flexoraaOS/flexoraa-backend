// A/B Testing & Experimentation Routes
const express = require('express');
const router = express.Router();
const abTestingService = require('../services/experimentation/abTestingService');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * POST /api/experiments/create
 * Create new A/B test experiment
 */
router.post('/create', authenticate, requireRole(['admin', 'product']), async (req, res, next) => {
    try {
        const { name, description, variants, targetMetric, sampleSize, duration } = req.body;

        const experimentId = await abTestingService.createExperiment({
            name,
            description,
            variants,
            targetMetric,
            sampleSize,
            duration,
            tenantId: req.user.tenant_id
        });

        res.json({ experimentId, status: 'active' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/experiments/:id/stop
 * Stop experiment (manual or kill-switch)
 */
router.post('/:id/stop', authenticate, requireRole(['admin', 'product']), async (req, res, next) => {
    try {
        const { reason, metadata } = req.body;
        await abTestingService.stopExperiment(req.params.id, reason, metadata);
        res.json({ success: true, message: 'Experiment stopped' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/experiments/:id/results
 * Get experiment results with statistical significance
 */
router.get('/:id/results', authenticate, async (req, res, next) => {
    try {
        const results = await abTestingService.calculateSignificance(req.params.id);
        res.json(results);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/experiments/:id/record
 * Record experiment result
 */
router.post('/:id/record', authenticate, async (req, res, next) => {
    try {
        const { leadId, metric, value } = req.body;
        await abTestingService.recordResult(req.params.id, leadId, metric, value);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/experiments/:id/variant/:leadId
 * Get variant assignment for lead
 */
router.get('/:id/variant/:leadId', authenticate, async (req, res, next) => {
    try {
        const variant = await abTestingService.getVariantPrompt(req.params.id, req.params.leadId);
        res.json(variant);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

// Monitoring & SLA Routes
const express = require('express');
const router = express.Router();
const slaMonitoringService = require('../services/monitoring/slaMonitoringService');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/monitoring/sla/dashboard
 * Get SLA dashboard data
 */
router.get('/sla/dashboard', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = await slaMonitoringService.getDashboardData(days);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/monitoring/sla/current
 * Get current SLA metrics
 */
router.get('/sla/current', authenticate, requireRole(['admin']), async (req, res, next) => {
    try {
        const metrics = {
            p90_ai_message: slaMonitoringService.calculateP90('ai_message'),
            p90_verification: slaMonitoringService.calculateP90('verification'),
            p90_routing: slaMonitoringService.calculateP90('routing'),
            error_rate: slaMonitoringService.calculateErrorRate(),
            uptime: slaMonitoringService.calculateUptime(),
            targets: slaMonitoringService.targets
        };
        res.json(metrics);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/monitoring/leakage/stats
 * Get lead leakage statistics
 */
router.get('/leakage/stats', authenticate, async (req, res, next) => {
    try {
        const leakageService = require('../services/leakage/leakagePreventionService');
        const days = parseInt(req.query.days) || 7;
        const stats = await leakageService.getLeakageStats(req.user.tenant_id, days);
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/monitoring/recovery/stats
 * Get cold recovery statistics
 */
router.get('/recovery/stats', authenticate, async (req, res, next) => {
    try {
        const coldRecoveryService = require('../services/recovery/coldRecoveryService');
        const days = parseInt(req.query.days) || 30;
        const stats = await coldRecoveryService.getRecoveryStats(req.user.tenant_id, days);
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/monitoring/drift/current
 * Get current model drift status
 */
router.get('/drift/current', authenticate, requireRole(['admin', 'product']), async (req, res, next) => {
    try {
        const driftService = require('../services/ai/driftMonitoringService');
        const modelVersion = req.query.version || '1.0';
        const drift = await driftService.detectDrift(modelVersion);
        res.json(drift);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/monitoring/drift/history
 * Get drift history
 */
router.get('/drift/history', authenticate, requireRole(['admin', 'product']), async (req, res, next) => {
    try {
        const driftService = require('../services/ai/driftMonitoringService');
        const days = parseInt(req.query.days) || 30;
        const history = await driftService.getDriftHistory(days);
        res.json(history);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/monitoring/drift/record-prediction
 * Record AI prediction for drift tracking
 */
router.post('/drift/record-prediction', authenticate, async (req, res, next) => {
    try {
        const driftService = require('../services/ai/driftMonitoringService');
        await driftService.recordPrediction(req.body);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

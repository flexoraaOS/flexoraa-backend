const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const analyticsService = require('../services/analyticsService');

/**
 * GET /api/analytics/roi
 * Campaign ROI and Conversion Rates
 */
router.get('/roi', verifyJWT, asyncHandler(async (req, res) => {
    const metrics = await analyticsService.getCampaignROI(req.user.tenant_id);
    res.json(metrics);
}));

/**
 * GET /api/analytics/funnel
 * Lead Conversion Funnel
 */
router.get('/funnel', verifyJWT, asyncHandler(async (req, res) => {
    const funnel = await analyticsService.getConversionFunnel(req.user.tenant_id);
    res.json(funnel);
}));

/**
 * GET /api/analytics/leaderboard
 * Team Performance Leaderboard
 */
router.get('/leaderboard', verifyJWT, asyncHandler(async (req, res) => {
    const leaderboard = await analyticsService.getTeamLeaderboard(req.user.tenant_id);
    res.json(leaderboard);
}));

/**
 * GET /api/analytics/messages
 * Message Volume Trends
 */
router.get('/messages', verifyJWT, asyncHandler(async (req, res) => {
    const { days } = req.query;
    const trends = await analyticsService.getMessageVolume(req.user.tenant_id, parseInt(days) || 30);
    res.json(trends);
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const campaignAnalyticsService = require('../services/analytics/campaignAnalyticsService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/analytics/campaigns
 * Get campaign analytics
 * Frontend: /dashboard/campaign-intelligence
 */
router.get('/campaigns', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const analytics = await campaignAnalyticsService.getCampaignAnalytics(
            tenantId,
            { from, to }
        );

        res.json({
            success: true,
            analytics
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get campaign analytics');
        res.status(500).json({
            error: 'Failed to get campaign analytics',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/sdr-performance
 * Get SDR performance analytics
 * Frontend: SDR Leaderboard component
 */
router.get('/sdr-performance', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const performance = await campaignAnalyticsService.getSDRPerformance(
            tenantId,
            { from, to }
        );

        res.json({
            success: true,
            performance
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get SDR performance');
        res.status(500).json({
            error: 'Failed to get SDR performance',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/overview
 * Get high-level analytics overview
 */
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const analytics = await campaignAnalyticsService.getCampaignAnalytics(
            tenantId,
            { from, to }
        );

        // Return just the overview section
        res.json({
            success: true,
            overview: analytics.overview
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get analytics overview');
        res.status(500).json({
            error: 'Failed to get analytics overview',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/funnel
 * Get conversion funnel data
 */
router.get('/funnel', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const analytics = await campaignAnalyticsService.getCampaignAnalytics(
            tenantId,
            { from, to }
        );

        res.json({
            success: true,
            funnel: analytics.conversion
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get funnel data');
        res.status(500).json({
            error: 'Failed to get funnel data',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/timeline
 * Get timeline data for charts
 */
router.get('/timeline', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const analytics = await campaignAnalyticsService.getCampaignAnalytics(
            tenantId,
            { from, to }
        );

        res.json({
            success: true,
            timeline: analytics.timeline
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get timeline data');
        res.status(500).json({
            error: 'Failed to get timeline data',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/channels
 * Get channel performance data
 */
router.get('/channels', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { from, to } = req.query;

        const analytics = await campaignAnalyticsService.getCampaignAnalytics(
            tenantId,
            { from, to }
        );

        res.json({
            success: true,
            channels: analytics.channels
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get channel performance');
        res.status(500).json({
            error: 'Failed to get channel performance',
            message: error.message
        });
    }
});

module.exports = router;

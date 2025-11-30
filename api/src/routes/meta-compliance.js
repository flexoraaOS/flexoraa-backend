// Meta Messaging Platforms Compliance Routes
const express = require('express');
const router = express.Router();
const metaComplianceService = require('../services/meta/metaComplianceService');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/meta-compliance/whatsapp/check/:leadId
 * Check if WhatsApp message can be sent to lead
 */
router.get('/whatsapp/check/:leadId', authenticate, async (req, res, next) => {
    try {
        const { messageType = 'freeform' } = req.query;
        const result = await metaComplianceService.canSendWhatsAppMessage(
            req.params.leadId,
            messageType
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/meta-compliance/instagram/check/:leadId
 * Check if Instagram DM can be sent to lead
 */
router.get('/instagram/check/:leadId', authenticate, async (req, res, next) => {
    try {
        const result = await metaComplianceService.canSendInstagramDM(req.params.leadId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/meta-compliance/facebook/check/:leadId
 * Check if Facebook Messenger message can be sent
 */
router.get('/facebook/check/:leadId', authenticate, async (req, res, next) => {
    try {
        const { messageType = 'user_initiated' } = req.query;
        const result = await metaComplianceService.canSendFacebookMessage(
            req.params.leadId,
            messageType
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/meta-compliance/instagram/engagement
 * Record Instagram engagement (comment, story reply, etc.)
 */
router.post('/instagram/engagement', authenticate, async (req, res, next) => {
    try {
        const { leadId, engagementType, metadata } = req.body;
        await metaComplianceService.recordInstagramEngagement(leadId, engagementType, metadata);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/meta-compliance/whatsapp/quality-score
 * Update WhatsApp quality score
 */
router.post('/whatsapp/quality-score', authenticate, requireRole(['admin']), async (req, res, next) => {
    try {
        const { tenantId, score } = req.body;
        await metaComplianceService.updateWhatsAppQualityScore(tenantId, score);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/meta-compliance/whatsapp/template/:templateName
 * Check if WhatsApp template is approved
 */
router.get('/whatsapp/template/:templateName', authenticate, async (req, res, next) => {
    try {
        const result = await metaComplianceService.isTemplateApproved(
            req.params.templateName,
            req.user.tenant_id
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/meta-compliance/dashboard
 * Get compliance dashboard data
 */
router.get('/dashboard', authenticate, async (req, res, next) => {
    try {
        const db = require('../config/database');
        
        // Get WhatsApp tier and quality
        const whatsappData = await db.query(
            `SELECT whatsapp_tier, whatsapp_quality_score, whatsapp_verified
             FROM tenants WHERE id = $1`,
            [req.user.tenant_id]
        );

        // Get recent violations
        const violations = await db.query(
            `SELECT * FROM meta_compliance_violations
             WHERE tenant_id = $1
             ORDER BY detected_at DESC
             LIMIT 10`,
            [req.user.tenant_id]
        );

        // Get template stats
        const templates = await db.query(
            `SELECT status, COUNT(*) as count
             FROM whatsapp_templates
             WHERE tenant_id = $1
             GROUP BY status`,
            [req.user.tenant_id]
        );

        // Get rate limit usage
        const rateLimits = await db.query(
            `SELECT 
                COUNT(*) FILTER (WHERE channel = 'whatsapp' AND created_at > NOW() - INTERVAL '24 hours') as whatsapp_24h,
                COUNT(*) FILTER (WHERE channel = 'instagram' AND created_at > NOW() - INTERVAL '1 hour') as instagram_1h,
                COUNT(*) FILTER (WHERE channel = 'facebook' AND created_at > NOW() - INTERVAL '24 hours') as facebook_24h
             FROM messages
             WHERE tenant_id = $1 AND direction = 'outbound'`,
            [req.user.tenant_id]
        );

        res.json({
            whatsapp: whatsappData.rows[0] || {},
            violations: violations.rows,
            templates: templates.rows,
            rateLimits: rateLimits.rows[0] || {}
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

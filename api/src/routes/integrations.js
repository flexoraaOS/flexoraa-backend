// Integration Routes (Gmail, Instagram, Facebook)
const express = require('express');
const router = express.Router();
const gmailIntegrationService = require('../services/email/gmailIntegrationService');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/integrations/gmail/auth-url
 * Get Gmail OAuth URL
 */
router.get('/gmail/auth-url', authenticate, async (req, res, next) => {
    try {
        const authUrl = gmailIntegrationService.getAuthUrl(req.user.tenant_id);
        res.json({ authUrl });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/integrations/gmail/callback
 * Handle Gmail OAuth callback
 */
router.get('/gmail/callback', async (req, res, next) => {
    try {
        const { code, state } = req.query;
        const tenantId = state; // Tenant ID passed in state

        await gmailIntegrationService.handleOAuthCallback(code, tenantId);

        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings/integrations?success=gmail`);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/integrations/gmail/send
 * Send email via Gmail
 */
router.post('/gmail/send', authenticate, async (req, res, next) => {
    try {
        const { to, subject, body, inReplyTo } = req.body;

        const result = await gmailIntegrationService.sendReply(
            req.user.tenant_id,
            to,
            subject,
            body,
            inReplyTo
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/integrations/status
 * Get integration status for tenant
 */
router.get('/status', authenticate, async (req, res, next) => {
    try {
        const db = require('../config/database');
        
        const result = await db.query(
            `SELECT provider, status, updated_at 
             FROM integration_credentials 
             WHERE tenant_id = $1`,
            [req.user.tenant_id]
        );

        const integrations = {
            gmail: result.rows.find(r => r.provider === 'gmail') || { status: 'not_connected' },
            instagram: result.rows.find(r => r.provider === 'instagram') || { status: 'not_connected' },
            facebook: result.rows.find(r => r.provider === 'facebook') || { status: 'not_connected' }
        };

        res.json(integrations);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/integrations/calendly/webhook
 * Handle Calendly webhooks
 */
router.post('/calendly/webhook', async (req, res, next) => {
    try {
        const calendlyService = require('../services/appointments/calendlyIntegrationService');
        await calendlyService.handleWebhook(req.body);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/integrations/calendly/link/:sdrId
 * Get SDR's Calendly scheduling link
 */
router.get('/calendly/link/:sdrId', authenticate, async (req, res, next) => {
    try {
        const calendlyService = require('../services/appointments/calendlyIntegrationService');
        const link = await calendlyService.getSchedulingLink(req.params.sdrId);
        res.json({ link });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

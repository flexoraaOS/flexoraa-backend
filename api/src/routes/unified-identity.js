// Unified Identity Routes
const express = require('express');
const router = express.Router();
const unifiedIdentityService = require('../services/identity/unifiedIdentityService');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/unified-identity/profile/:leadId
 * Get 360° unified profile for a lead
 */
router.get('/profile/:leadId', authenticate, async (req, res, next) => {
    try {
        const profile = await unifiedIdentityService.getUnifiedProfile(req.params.leadId);
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/unified-identity/resolve/:leadId
 * Manually trigger identity resolution for a lead
 */
router.post('/resolve/:leadId', authenticate, async (req, res, next) => {
    try {
        const db = require('../config/database');
        
        // Get lead data
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [req.params.leadId]);
        
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const identityId = await unifiedIdentityService.findOrCreateIdentity(leadResult.rows[0]);

        res.json({ 
            success: true, 
            identityId,
            message: 'Identity resolved successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/unified-identity/merge
 * Merge two identities
 */
router.post('/merge', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const { primaryIdentityId, secondaryIdentityId, reason } = req.body;

        if (!primaryIdentityId || !secondaryIdentityId) {
            return res.status(400).json({ error: 'Both identity IDs required' });
        }

        const mergedIdentityId = await unifiedIdentityService.mergeIdentities(
            primaryIdentityId,
            secondaryIdentityId,
            reason || 'manual_merge'
        );

        res.json({ 
            success: true, 
            identityId: mergedIdentityId,
            message: 'Identities merged successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/unified-identity/duplicates
 * Find potential duplicate identities
 */
router.get('/duplicates', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const duplicates = await unifiedIdentityService.findPotentialDuplicates(
            req.user.tenant_id,
            limit
        );

        res.json({ duplicates, count: duplicates.length });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/unified-identity/stats
 * Get unified identity statistics for tenant
 */
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const db = require('../config/database');
        
        const stats = await db.query(
            `SELECT 
                COUNT(DISTINCT ui.id) as total_identities,
                COUNT(DISTINCT l.id) as total_leads,
                COUNT(DISTINCT l.channel) as total_channels,
                AVG(lead_counts.lead_count) as avg_leads_per_identity,
                COUNT(DISTINCT CASE WHEN ui.status = 'merged' THEN ui.id END) as merged_identities
             FROM unified_identities ui
             LEFT JOIN leads l ON l.unified_identity_id = ui.id
             LEFT JOIN (
                 SELECT unified_identity_id, COUNT(*) as lead_count
                 FROM leads
                 GROUP BY unified_identity_id
             ) lead_counts ON lead_counts.unified_identity_id = ui.id
             WHERE ui.tenant_id = $1`,
            [req.user.tenant_id]
        );

        // Get channel distribution
        const channelDist = await db.query(
            `SELECT l.channel, COUNT(DISTINCT l.unified_identity_id) as identity_count
             FROM leads l
             JOIN unified_identities ui ON ui.id = l.unified_identity_id
             WHERE ui.tenant_id = $1 AND ui.status = 'active'
             GROUP BY l.channel`,
            [req.user.tenant_id]
        );

        res.json({
            ...stats.rows[0],
            channelDistribution: channelDist.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/unified-identity/search
 * Search for unified identities
 */
router.get('/search', authenticate, async (req, res, next) => {
    try {
        const { query, type } = req.query; // type: phone, email, name, instagram
        const db = require('../config/database');

        let searchQuery;
        let params = [req.user.tenant_id];

        if (type === 'phone') {
            searchQuery = `
                SELECT ui.*, 
                       (SELECT COUNT(*) FROM leads WHERE unified_identity_id = ui.id) as lead_count
                FROM unified_identities ui
                WHERE ui.tenant_id = $1 
                  AND ui.identifiers->>'phone_number' LIKE $2
                  AND ui.status = 'active'
                LIMIT 20
            `;
            params.push(`%${query}%`);
        } else if (type === 'email') {
            searchQuery = `
                SELECT ui.*,
                       (SELECT COUNT(*) FROM leads WHERE unified_identity_id = ui.id) as lead_count
                FROM unified_identities ui
                WHERE ui.tenant_id = $1 
                  AND ui.identifiers->>'email' ILIKE $2
                  AND ui.status = 'active'
                LIMIT 20
            `;
            params.push(`%${query}%`);
        } else if (type === 'instagram') {
            searchQuery = `
                SELECT ui.*,
                       (SELECT COUNT(*) FROM leads WHERE unified_identity_id = ui.id) as lead_count
                FROM unified_identities ui
                WHERE ui.tenant_id = $1 
                  AND ui.identifiers->>'instagram_username' ILIKE $2
                  AND ui.status = 'active'
                LIMIT 20
            `;
            params.push(`%${query}%`);
        } else {
            // Name search
            searchQuery = `
                SELECT ui.*,
                       (SELECT COUNT(*) FROM leads WHERE unified_identity_id = ui.id) as lead_count
                FROM unified_identities ui
                WHERE ui.tenant_id = $1 
                  AND ui.identifiers->>'name' ILIKE $2
                  AND ui.status = 'active'
                LIMIT 20
            `;
            params.push(`%${query}%`);
        }

        const result = await db.query(searchQuery, params);

        res.json({ results: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

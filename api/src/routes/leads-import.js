const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvImportService = require('../services/leads/csvImportService');
const leadAssignmentService = require('../services/leads/leadAssignmentService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * POST /api/leads/import/csv
 * Import leads from CSV file
 * Frontend: /dashboard/upload-leads
 */
router.post('/csv', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const metadata = {
            campaign_name: req.body.campaign_name,
            campaign_id: req.body.campaign_id,
            source: 'csv_upload',
            uploaded_by: userId
        };

        const results = await csvImportService.importFromCSV(
            file.buffer,
            tenantId,
            userId,
            metadata
        );

        res.json({
            success: true,
            message: `Imported ${results.successful} leads successfully`,
            results
        });

    } catch (error) {
        logger.error({ err: error }, 'CSV import failed');
        res.status(500).json({
            error: 'Failed to import CSV',
            message: error.message
        });
    }
});

/**
 * GET /api/leads/import/history
 * Get import history
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const limit = parseInt(req.query.limit) || 50;

        const history = await csvImportService.getImportHistory(tenantId, limit);

        res.json({
            success: true,
            history
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get import history');
        res.status(500).json({
            error: 'Failed to get import history',
            message: error.message
        });
    }
});

/**
 * POST /api/leads/assign
 * Assign leads to SDR
 * Frontend: /dashboard/leados/leads-assign
 */
router.post('/assign', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { leadIds, sdrId, reason } = req.body;

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds array is required' });
        }

        if (!sdrId) {
            return res.status(400).json({ error: 'sdrId is required' });
        }

        const results = await leadAssignmentService.assignLeads(
            leadIds,
            sdrId,
            tenantId,
            userId,
            { reason }
        );

        res.json({
            success: true,
            message: `Assigned ${results.successful.length} leads successfully`,
            results
        });

    } catch (error) {
        logger.error({ err: error }, 'Lead assignment failed');
        res.status(500).json({
            error: 'Failed to assign leads',
            message: error.message
        });
    }
});

/**
 * POST /api/leads/:leadId/reassign
 * Reassign lead to different SDR
 */
router.post('/:leadId/reassign', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { leadId } = req.params;
        const { newSdrId, reason } = req.body;

        if (!newSdrId) {
            return res.status(400).json({ error: 'newSdrId is required' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'reason is required' });
        }

        const result = await leadAssignmentService.reassignLead(
            leadId,
            newSdrId,
            tenantId,
            userId,
            reason
        );

        res.json({
            success: true,
            message: 'Lead reassigned successfully',
            result
        });

    } catch (error) {
        logger.error({ err: error }, 'Lead reassignment failed');
        res.status(500).json({
            error: 'Failed to reassign lead',
            message: error.message
        });
    }
});

/**
 * GET /api/leads/sdr/:sdrId/workload
 * Get SDR workload
 */
router.get('/sdr/:sdrId/workload', authenticateToken, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { sdrId } = req.params;

        const workload = await leadAssignmentService.getSDRWorkload(sdrId, tenantId);

        res.json({
            success: true,
            workload
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to get SDR workload');
        res.status(500).json({
            error: 'Failed to get SDR workload',
            message: error.message
        });
    }
});

module.exports = router;

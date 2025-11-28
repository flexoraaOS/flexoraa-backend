const express = require('express');
const router = express.Router();
const n8nService = require('../services/n8nService');
const { authenticate, requireScope } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { perUserRateLimiter } = require('../middleware/rateLimiter');

/**
 * Trigger campaign workflow manually
 */
router.post('/send-campaign',
    authenticate,
    requireScope('workflows:execute'),
    perUserRateLimiter,
    asyncHandler(async (req, res) => {
        const { campaign_id, user_id } = req.body;

        if (!campaign_id || !user_id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'campaign_id and user_id are required'
            });
        }

        const result = await n8nService.triggerWorkflow('workflow-campaign', {
            campaign_id,
            user_id,
            triggered_by: req.user?.id || req.apiKey?.name
        });

        res.json({
            status: 'success',
            message: 'Campaign workflow triggered',
            executionId: result.executionId
        });
    })
);

/**
 * Verify leads
 */
router.post('/verify-leads',
    authenticate,
    requireScope('workflows:execute'),
    perUserRateLimiter,
    asyncHandler(async (req, res) => {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'user_id is required'
            });
        }

        const result = await n8nService.triggerWorkflow('workflow-6', {
            body: { user_id },
            triggered_by: req.user?.id || req.apiKey?.name
        });

        res.json({
            status: 'success',
            message: 'Lead verification started',
            executionId: result.executionId
        });
    })
);

/**
 * Generate prompts
 */
router.post('/generate-prompts',
    authenticate,
    requireScope('workflows:execute'),
    perUserRateLimiter,
    asyncHandler(async (req, res) => {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'user_id is required'
            });
        }

        const result = await n8nService.triggerWorkflow('workflow-5', {
            body: { user_id },
            triggered_by: req.user?.id || req.apiKey?.name
        });

        res.json({
            status: 'success',
            message: 'Prompt generation started',
            executionId: result.executionId
        });
    })
);

/**
 * Get workflow execution status
 */
router.get('/:executionId/status',
    authenticate,
    requireScope('workflows:read'),
    asyncHandler(async (req, res) => {
        const { executionId } = req.params;

        const status = await n8nService.getExecutionStatus(executionId);

        res.json(status);
    })
);

/**
 * Get workflow execution logs
 */
router.get('/:executionId/logs',
    authenticate,
    requireScope('workflows:read'),
    asyncHandler(async (req, res) => {
        const { executionId } = req.params;

        const logs = await n8nService.getExecutionLogs(executionId);

        res.json(logs);
    })
);

module.exports = router;

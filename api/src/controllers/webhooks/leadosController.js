const db = require('../../config/database');
const logger = require('../../utils/logger');
const { evaluateExpression } = require('../../utils/expressionEngine');
const { mergeByField } = require('../../utils/mergeData');
const { generateMarketingContent } = require('../../services/ai/marketingService');

/**
 * POST /webhooks/leados
 * Implements n8n Workflow 1 logic:
 * 1. Extract auth + user_id
 * 2. Get all leads for user
 * 3. Get active campaign for user
 * 4. Merge data by user_id
 * 5. Generate AI marketing content
 * 6. Return structured output
 */
exports.handleLeados = async (req, res) => {
    try {
        const { user_id } = req.body;
        const authorization = req.headers.authorization;

        logger.info('Leados webhook triggered', { user_id });

        // Step 1: Get all leads (matches "Getting Leads" node)
        const leadsResult = await db.query(
            'SELECT * FROM leads WHERE user_id = $1',
            [user_id]
        );
        const leads = leadsResult.rows;

        // Step 2: Get active campaign (matches "Get a row" node)
        const campaignResult = await db.query(
            'SELECT * FROM campaigns WHERE user_id = $1 AND status = $2 LIMIT 1',
            [user_id, 'active']
        );
        const campaign = campaignResult.rows[0] || {};

        // Step 3: Merge leads + campaign by user_id (matches "Merge" node)
        const mergedData = mergeByField(leads, [campaign], 'user_id');

        // Step 4: Prepare data for AI (matches "Edit Fields1")
        const aiInput = mergedData.map(item => ({
            user_id: String(item.user_id),
            phone_number: String(item.phone_number),
            status: String(item.status),
            name: String(item.name),
            description: String(item.description || campaign.description)
        }));

        // Step 5: Generate AI marketing content (matches "AI Agent1" + "Google Gemini")
        const results = [];
        for (const input of aiInput) {
            try {
                const aiOutput = await generateMarketingContent({
                    name: input.name,
                    description: input.description,
                    phone_number: input.phone_number
                });
                results.push(aiOutput);
            } catch (error) {
                // continueOnError behavior
                logger.error('AI generation failed, continuing', { error });
                results.push({
                    phone_number: input.phone_number,
                    output: '',
                    company: input.name
                });
            }
        }

        // Step 6: Return structured output
        res.json({
            success: true,
            results
        });

    } catch (error) {
        logger.error('Leados webhook error', { error });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

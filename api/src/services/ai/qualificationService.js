// Multi-Turn AI Qualification Service
// Implements 6-turn structured interview for lead qualification
const geminiService = require('./geminiService');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const tokenService = require('../payment/tokenService');

class QualificationService {
    constructor() {
        // 6-turn qualification flow
        this.qualificationSteps = [
            {
                turn: 1,
                goal: 'understand_need',
                prompt: 'What specific challenge or need brings you here today?',
                extractFields: ['intent', 'pain_point']
            },
            {
                turn: 2,
                goal: 'budget_discovery',
                prompt: 'To ensure we recommend the right solution, what budget range are you working with?',
                extractFields: ['budget_range']
            },
            {
                turn: 3,
                goal: 'timeline_assessment',
                prompt: 'When are you looking to implement a solution?',
                extractFields: ['timeline', 'urgency']
            },
            {
                turn: 4,
                goal: 'decision_authority',
                prompt: 'Are you the primary decision-maker, or will others be involved in this decision?',
                extractFields: ['decision_authority', 'stakeholders']
            },
            {
                turn: 5,
                goal: 'objections_concerns',
                prompt: 'What concerns or questions do you have before moving forward?',
                extractFields: ['objections', 'concerns']
            },
            {
                turn: 6,
                goal: 'next_steps',
                prompt: 'Based on what you\'ve shared, I\'d like to connect you with our specialist. Would you prefer a call or meeting?',
                extractFields: ['preferred_contact', 'availability']
            }
        ];
    }

    /**
     * Start qualification conversation for a lead
     */
    async startQualification(leadId, tenantId) {
        try {
            // Initialize qualification state
            await db.query(
                `INSERT INTO lead_qualification_state (
                    lead_id, current_turn, status, started_at
                ) VALUES ($1, 1, 'in_progress', NOW())
                ON CONFLICT (lead_id) DO UPDATE 
                SET current_turn = 1, status = 'in_progress', started_at = NOW()`,
                [leadId]
            );

            // Get first question
            const firstStep = this.qualificationSteps[0];
            
            logger.info({ leadId, turn: 1 }, 'Qualification started');
            
            return {
                turn: 1,
                message: firstStep.prompt,
                goal: firstStep.goal
            };

        } catch (error) {
            logger.error({ err: error, leadId }, 'Failed to start qualification');
            throw error;
        }
    }

    /**
     * Process lead response and advance to next turn
     */
    async processResponse(leadId, tenantId, response) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Get current qualification state
            const stateRes = await client.query(
                'SELECT * FROM lead_qualification_state WHERE lead_id = $1 FOR UPDATE',
                [leadId]
            );

            if (stateRes.rows.length === 0) {
                throw new Error('Qualification not started');
            }

            const state = stateRes.rows[0];
            const currentStep = this.qualificationSteps[state.current_turn - 1];

            // Extract information using AI
            const extracted = await this._extractInformation(
                response,
                currentStep.extractFields,
                state.extracted_data || {}
            );

            // Deduct tokens for AI qualification
            await tokenService.deductTokens(
                tenantId,
                2,
                'ai_qualification',
                `Qualification turn ${state.current_turn}`,
                leadId
            );

            // Update extracted data
            const updatedData = { ...state.extracted_data, ...extracted };

            // Check if qualification should continue or escalate
            const shouldEscalate = await this._checkEscalation(updatedData, state.current_turn);

            if (shouldEscalate) {
                await this._escalateToSDR(client, leadId, tenantId, updatedData, 'qualification_complete');
                await client.query('COMMIT');
                
                return {
                    completed: true,
                    escalated: true,
                    message: 'Thank you for sharing that information. I\'m connecting you with our specialist who can help you right away.',
                    extractedData: updatedData
                };
            }

            // Move to next turn
            const nextTurn = state.current_turn + 1;
            const isComplete = nextTurn > this.qualificationSteps.length;

            if (isComplete) {
                // Qualification complete
                await client.query(
                    `UPDATE lead_qualification_state 
                     SET status = 'completed', 
                         current_turn = $1,
                         extracted_data = $2,
                         completed_at = NOW()
                     WHERE lead_id = $3`,
                    [nextTurn, JSON.stringify(updatedData), leadId]
                );

                // Update lead with extracted data
                await this._updateLeadProfile(client, leadId, updatedData);

                // Route to SDR
                await this._escalateToSDR(client, leadId, tenantId, updatedData, 'qualification_complete');

                await client.query('COMMIT');

                return {
                    completed: true,
                    escalated: true,
                    message: 'Perfect! I have all the information I need. Let me connect you with the right person on our team.',
                    extractedData: updatedData
                };
            }

            // Continue to next turn
            await client.query(
                `UPDATE lead_qualification_state 
                 SET current_turn = $1, extracted_data = $2
                 WHERE lead_id = $3`,
                [nextTurn, JSON.stringify(updatedData), leadId]
            );

            await client.query('COMMIT');

            const nextStep = this.qualificationSteps[nextTurn - 1];

            return {
                completed: false,
                turn: nextTurn,
                message: nextStep.prompt,
                goal: nextStep.goal,
                extractedData: updatedData
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, leadId }, 'Qualification processing failed');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Extract structured information from response using AI
     */
    async _extractInformation(response, fields, existingData) {
        const prompt = `Extract the following information from this customer response:
Fields to extract: ${fields.join(', ')}

Customer response: "${response}"

Existing data: ${JSON.stringify(existingData)}

Return a JSON object with extracted values. For budget_range, use: "$1K-5K", "$5K-50K", "$50K+", or "not_specified".
For timeline, use: "immediate", "1-3mo", "3-6mo", "exploring", or "not_specified".
For intent, use: "high", "medium", "low".

Example output:
{
  "intent": "high",
  "budget_range": "$5K-50K",
  "timeline": "1-3mo",
  "pain_point": "struggling with lead management"
}`;

        try {
            const response_text = await geminiService.generateText(prompt, { maxTokens: 200 });
            
            // Parse JSON from response
            const jsonMatch = response_text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {};
        } catch (error) {
            logger.error({ err: error }, 'Information extraction failed');
            return {};
        }
    }

    /**
     * Check if lead should be escalated early
     */
    async _checkEscalation(extractedData, currentTurn) {
        // High-ticket budget mentioned
        if (extractedData.budget_range === '$50K+') {
            return true;
        }

        // Immediate timeline + high intent
        if (extractedData.timeline === 'immediate' && extractedData.intent === 'high') {
            return true;
        }

        // Ready to buy signals
        const buyingSignals = ['ready to buy', 'schedule call', 'speak to someone', 'need immediately'];
        if (extractedData.pain_point && buyingSignals.some(signal => 
            extractedData.pain_point.toLowerCase().includes(signal)
        )) {
            return true;
        }

        return false;
    }

    /**
     * Update lead profile with extracted qualification data
     */
    async _updateLeadProfile(client, leadId, extractedData) {
        await client.query(
            `UPDATE leads 
             SET metadata = metadata || $1::jsonb
             WHERE id = $2`,
            [JSON.stringify({
                qualification: extractedData,
                qualified_at: new Date().toISOString()
            }), leadId]
        );
    }

    /**
     * Escalate to SDR
     */
    async _escalateToSDR(client, leadId, tenantId, extractedData, reason) {
        const routingService = require('../routing/routingService');
        
        // Calculate score based on extracted data
        const score = this._calculateQualificationScore(extractedData);

        // Route to appropriate SDR
        await routingService.routeLead(leadId, score);

        logger.info({ leadId, score, reason }, 'Lead escalated to SDR');
    }

    /**
     * Calculate score from qualification data
     */
    _calculateQualificationScore(data) {
        let score = 50; // Base score

        // Budget scoring
        if (data.budget_range === '$50K+') score += 20;
        else if (data.budget_range === '$5K-50K') score += 15;
        else if (data.budget_range === '$1K-5K') score += 10;

        // Timeline scoring
        if (data.timeline === 'immediate') score += 15;
        else if (data.timeline === '1-3mo') score += 10;
        else if (data.timeline === '3-6mo') score += 5;

        // Intent scoring
        if (data.intent === 'high') score += 15;
        else if (data.intent === 'medium') score += 8;

        // Decision authority
        if (data.decision_authority === 'primary') score += 10;

        return Math.min(100, score);
    }

    /**
     * Get qualification progress for a lead
     */
    async getQualificationState(leadId) {
        const result = await db.query(
            'SELECT * FROM lead_qualification_state WHERE lead_id = $1',
            [leadId]
        );

        return result.rows[0] || null;
    }
}

module.exports = new QualificationService();

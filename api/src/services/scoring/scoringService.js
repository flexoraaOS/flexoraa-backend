// Lead Scoring Service
// Hybrid AI + Deterministic scoring engine with explainability
const geminiService = require('../ai/geminiService');
const logger = require('../../utils/logger');

// Deterministic scoring rules
const SCORING_RULES = {
    // Response time scoring (faster = higher score)
    responseTime: {
        weight: 15,
        calculate: (metadata) => {
            const responseTimeMs = metadata?.response_time_ms || null;
            if (!responseTimeMs) return 0;

            // < 1 hour = 15 points
            if (responseTimeMs < 3600000) return 15;
            // < 4 hours = 10 points
            if (responseTimeMs < 14400000) return 10;
            // < 24 hours = 5 points
            if (responseTimeMs < 86400000) return 5;
            return 0;
        }
    },

    // Keyword matching (buying intent signals)
    keywords: {
        weight: 20,
        calculate: (message) => {
            if (!message) return 0;

            const highIntent = ['buy', 'purchase', 'price', 'cost', 'when', 'available', 'order'];
            const mediumIntent = ['interested', 'more info', 'details', 'learn'];

            const lowerMessage = message.toLowerCase();
            const highCount = highIntent.filter(kw => lowerMessage.includes(kw)).length;
            const mediumCount = mediumIntent.filter(kw => lowerMessage.includes(kw)).length;

            return Math.min(20, (highCount * 8) + (mediumCount * 4));
        }
    },

    // Engagement frequency (number of interactions)
    engagement: {
        weight: 15,
        calculate: (metadata) => {
            const interactionCount = metadata?.interaction_count || 0;

            if (interactionCount >= 5) return 15;
            if (interactionCount >= 3) return 10;
            if (interactionCount >= 1) return 5;
            return 0;
        }
    },

    // Message length (detailed responses = higher intent)
    messageLength: {
        weight: 10,
        calculate: (message) => {
            if (!message) return 0;
            const wordCount = message.split(/\s+/).length;

            if (wordCount > 50) return 10;
            if (wordCount > 20) return 7;
            if (wordCount > 5) return 4;
            return 0;
        }
    },

    // Has WhatsApp (verified contact method)
    hasWhatsApp: {
        weight: 10,
        calculate: (lead) => lead.has_whatsapp ? 10 : 0
    },

    // Temperature override (manual classification)
    temperature: {
        weight: 20,
        calculate: (lead) => {
            const temp = lead.temperature?.toUpperCase();
            if (temp === 'HOT') return 20;
            if (temp === 'WARM') return 13;
            if (temp === 'COLD') return 5;
            return 10; // natural = default medium
        }
    }
};

/**
 * Calculate deterministic score based on rules
 */
function calculateDeterministicScore(lead) {
    const scores = [];
    const explanations = [];

    // Response time
    const responseScore = SCORING_RULES.responseTime.calculate(lead.metadata);
    scores.push(responseScore);
    if (responseScore > 0) {
        explanations.push(`Response time: +${responseScore} points`);
    }

    // Keywords
    const keywordScore = SCORING_RULES.keywords.calculate(lead.message);
    scores.push(keywordScore);
    if (keywordScore > 0) {
        explanations.push(`Buying intent keywords: +${keywordScore} points`);
    }

    // Engagement
    const engagementScore = SCORING_RULES.engagement.calculate(lead.metadata);
    scores.push(engagementScore);
    if (engagementScore > 0) {
        explanations.push(`Engagement frequency: +${engagementScore} points`);
    }

    // Message length
    const lengthScore = SCORING_RULES.messageLength.calculate(lead.message);
    scores.push(lengthScore);
    if (lengthScore > 0) {
        explanations.push(`Message detail level: +${lengthScore} points`);
    }

    // Has WhatsApp
    const whatsappScore = SCORING_RULES.hasWhatsApp.calculate(lead);
    scores.push(whatsappScore);
    if (whatsappScore > 0) {
        explanations.push(`Verified WhatsApp: +${whatsappScore} points`);
    }

    // Temperature
    const tempScore = SCORING_RULES.temperature.calculate(lead);
    scores.push(tempScore);
    explanations.push(`Lead temperature (${lead.temperature || 'natural'}): +${tempScore} points`);

    const total = scores.reduce((a, b) => a + b, 0);

    return {
        score: total,
        maxScore: 100,
        explanations
    };
}

/**
 * Get AI-based score using Gemini
 */
async function getAIScore(lead, campaignContext = null) {
    try {
        const prompt = `Analyze this lead and provide a conversion probability score (0-30).
        
Lead Information:
- Name: ${lead.name || 'Unknown'}
- Message: ${lead.message || 'No message'}
- Phone: ${lead.phone_number}
- Status: ${lead.status}
- Contacted: ${lead.contacted ? 'Yes' : 'No'}
${campaignContext ? `\nCampaign Context: ${campaignContext}` : ''}

Provide a score (0-30) and brief explanation of why this lead is or isn't likely to convert.`;

        const response = await geminiService.generateText(prompt, {
            maxTokens: 100
        });

        // Extract score from response (basic parsing)
        const scoreMatch = response.match(/(\d+)/);
        const aiScore = scoreMatch ? Math.min(30, parseInt(scoreMatch[1])) : 15;

        return {
            score: aiScore,
            maxScore: 30,
            explanation: response.substring(0, 200) // Limit explanation length
        };
    } catch (error) {
        logger.error({ err: error }, 'AI scoring failed, using default');
        return {
            score: 15, // Default middle score
            maxScore: 30,
            explanation: 'AI scoring unavailable'
        };
    }
}

/**
 * Calculate comprehensive lead score (deterministic + AI)
 * Returns score out of 100 with detailed explanation
 */
async function scoreLead(lead, options = {}) {
    const { includedAI = true, campaignContext = null } = options;

    // Deterministic scoring (70% weight)
    const deterministicResult = calculateDeterministicScore(lead);

    let aiResult = { score: 0, maxScore: 30, explanation: 'AI scoring disabled' };

    // AI scoring (30% weight) - optional
    if (includedAI) {
        aiResult = await getAIScore(lead, campaignContext);
    }

    // Combine scores
    const totalScore = deterministicResult.score + aiResult.score;
    const maxTotalScore = deterministicResult.maxScore + aiResult.maxScore;
    const normalizedScore = Math.round((totalScore / maxTotalScore) * 100);

    // Categorize
    let category = 'COLD';
    if (normalizedScore >= 75) category = 'HOT';
    else if (normalizedScore >= 50) category = 'WARM';

    return {
        score: normalizedScore,
        category,
        breakdown: {
            deterministic: {
                score: deterministicResult.score,
                maxScore: deterministicResult.maxScore,
                explanations: deterministicResult.explanations
            },
            ai: {
                score: aiResult.score,
                maxScore: aiResult.maxScore,
                explanation: aiResult.explanation
            }
        },
        scoredAt: new Date().toISOString()
    };
}

/**
 * Bulk score multiple leads
 */
async function scoreLeads(leads, options = {}) {
    const results = [];

    for (const lead of leads) {
        try {
            const score = await scoreLead(lead, options);
            results.push({
                leadId: lead.id,
                ...score
            });
        } catch (error) {
            logger.error({ err: error, leadId: lead.id }, 'Failed to score lead');
            results.push({
                leadId: lead.id,
                error: 'Scoring failed',
                score: 0
            });
        }
    }

    return results;
}

module.exports = {
    scoreLead,
    scoreLeads,
    calculateDeterministicScore
};

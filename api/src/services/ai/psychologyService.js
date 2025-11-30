const logger = require('../../utils/logger');

class PsychologyService {
    /**
     * Get psychology-driven system prompt modifier based on lead score
     * @param {object} lead - Lead object with score and intent
     */
    getPersuasionStrategy(lead) {
        const score = lead.score || 0;

        // HOT Leads (61-100): Scarcity + Authority + Urgency
        if (score > 60) {
            return `
                [PSYCHOLOGY STRATEGY: HOT LEAD]
                - This lead is ready to buy. Do NOT be passive.
                - USE SCARCITY: Mention limited availability (e.g., "Only 2 slots left this week").
                - USE AUTHORITY: Cite specific ROI figures (e.g., "Our top clients see 40% ROI").
                - USE URGENCY: Encourage immediate action.
                - CTA: Direct close (e.g., "Shall I book you for tomorrow?").
            `;
        }

        // WARM Leads (31-60): Trust + Social Proof + Benefit Stacking
        if (score > 30) {
            return `
                [PSYCHOLOGY STRATEGY: WARM LEAD]
                - This lead is interested but needs nurturing. Build trust.
                - USE SOCIAL PROOF: Mention similar companies (e.g., "Companies like [Industry Leader] are seeing results").
                - USE BENEFIT STACKING: Combine benefits (e.g., "Save time + reduce costs + scale faster").
                - CTA: Low-friction commitment (e.g., "Would a 15-min call help clarify?").
            `;
        }

        // COLD Leads (0-30): Curiosity + Re-engagement + Education
        return `
            [PSYCHOLOGY STRATEGY: COLD LEAD]
            - This lead is early stage or disengaged. Pique curiosity.
            - USE CURIOSITY: Share an insight or trend (e.g., "3 trends affecting your industry right now").
            - USE EDUCATION: Offer value before asking for anything.
            - SOFT CTA: Ask for permission to share more (e.g., "Want me to send relevant insights?").
        `;
    }

    /**
     * Get specific prompt for objection handling
     */
    getObjectionHandlingStrategy(objectionType) {
        const strategies = {
            'price': 'Reframing: Shift focus from cost to investment/ROI.',
            'timing': 'Urgency: Highlight the cost of inaction.',
            'competitor': 'Differentiation: Focus on unique value prop (Psychology Engine).',
            'trust': 'Social Proof: Share case studies or testimonials.'
        };
        return strategies[objectionType] || 'Empathy: Acknowledge concern and pivot to value.';
    }
}

module.exports = new PsychologyService();

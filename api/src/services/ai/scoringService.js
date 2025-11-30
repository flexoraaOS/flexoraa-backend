const db = require('../../config/database');
const logger = require('../../utils/logger');

class ScoringService {
    /**
     * Calculate and update lead score based on 5-factor algorithm
     * @param {string} leadId 
     */
    async updateLeadScore(leadId) {
        const client = await db.connect();
        try {
            // 1. Fetch Lead Data
            const res = await client.query(
                `SELECT * FROM leads WHERE id = $1`,
                [leadId]
            );
            const lead = res.rows[0];
            if (!lead) return;

            // 2. Calculate Factors
            const factors = this.calculateFactors(lead);

            // 3. Weighted Sum
            // Budget (30%) + Intent (25%) + Engagement (20%) + Latency (15%) + Lifecycle (10%)
            const totalScore = Math.round(
                (factors.budget * 0.30) +
                (factors.intent * 0.25) +
                (factors.engagement * 0.20) +
                (factors.latency * 0.15) +
                (factors.lifecycle * 0.10)
            );

            // 4. Update DB
            await client.query(
                `UPDATE leads 
                 SET score = $1, 
                     score_breakdown = $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [totalScore, factors, leadId]
            );

            logger.info({ leadId, totalScore, factors }, 'Lead score updated');
            return totalScore;

        } catch (error) {
            logger.error({ err: error, leadId }, 'Scoring failed');
        } finally {
            client.release();
        }
    }

    calculateFactors(lead) {
        const now = new Date();

        // 1. Budget (30%)
        let budgetScore = 30; // Default Low
        const budget = parseFloat(lead.budget_estimate || 0);
        if (budget >= 50000) budgetScore = 100; // High Ticket
        else if (budget >= 5000) budgetScore = 60; // Mid Ticket

        // 2. Intent (25%)
        let intentScore = 30;
        if (lead.intent_level === 'high') intentScore = 100;
        else if (lead.intent_level === 'medium') intentScore = 60;

        // 3. Engagement (20%)
        let engagementScore = 30;
        if (lead.interaction_count >= 10) engagementScore = 100;
        else if (lead.interaction_count >= 5) engagementScore = 60;

        // 4. Latency (15%) - Response speed
        let latencyScore = 50; // Default average
        if (lead.last_interaction_at) {
            const diffMinutes = (now - new Date(lead.last_interaction_at)) / 1000 / 60;
            if (diffMinutes < 5) latencyScore = 100; // Instant
            else if (diffMinutes < 60) latencyScore = 80; // Fast
            else if (diffMinutes > 1440) latencyScore = 20; // Slow (>24h)
        }

        // 5. Lifecycle (10%) - Newness
        let lifecycleScore = 50;
        const ageHours = (now - new Date(lead.created_at)) / 1000 / 60 / 60;
        if (ageHours < 24) lifecycleScore = 100; // Fresh lead
        else if (ageHours < 72) lifecycleScore = 70; // Recent

        return {
            budget: budgetScore,
            intent: intentScore,
            engagement: engagementScore,
            latency: latencyScore,
            lifecycle: lifecycleScore
        };
    }
}

module.exports = new ScoringService();

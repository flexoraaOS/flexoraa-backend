// Google Gemini AI Service (STUB for Phase 1)
// Phase 2: Replace with real Gemini API calls
const logger = require('../../utils/logger');
const config = require('../../config/env');

class GeminiService {
    constructor() {
        this.enabled = config.ENABLE_AI_SERVICES;
        this.apiKey = config.GEMINI_API_KEY;
        this.tokenUsage = new Map(); // tenant_id -> token count today
        this.dailyLimit = config.GEMINI_DAILY_TOKEN_LIMIT || 100000;
        this.alertThreshold = config.GEMINI_ALERT_THRESHOLD || 80000;
    }

    /**
     * Generate chat completion (STUBBED)
     * @param {string} prompt - The prompt text
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} - { text, tokenCount }
     */
    async generateText(prompt, options = {}) {
        if (!this.enabled) {
            logger.info('Gemini service disabled (stub mode)');
            return {
                text: '[STUB] AI-generated response for: ' + prompt.substring(0, 50) + '...',
                tokenCount: 50,
                model: 'stub',
            };
        }

        // TODO Phase 2: Real Gemini API call
        // const response = await axios.post('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
        //   contents: [{ parts: [{ text: prompt }] }],
        // }, {
        //   headers: { 'x-goog-api-key': this.apiKey },
        // });

        // Stub response
        const stubResponse = {
            text: `[STUB] Generated marketing copy: "Transform your business with data-driven insights! Contact us to learn more."`,
            tokenCount: Math.floor(Math.random() * 100) + 50,
            model: 'gemini-pro-stub',
        };

        // Track token usage
        this.trackTokenUsage(options.tenantId, stubResponse.tokenCount);

        return stubResponse;
    }

    /**
     * Generate structured output (STUBBED)
     * @param {string} prompt - The prompt
     * @param {Object} schema - Expected JSON schema
     * @returns {Promise<Object>} - Parsed JSON output
     */
    async generateStructured(prompt, schema, options = {}) {
        if (!this.enabled) {
            return {
                phone_number: '+918927665759',
                output: '[STUB] AI-generated marketing message',
                company: 'Demo Company',
            };
        }

        // Stub structured response
        return {
            phone_number: options.phoneNumber || '+910000000000',
            output: '[STUB] Turn insights into income! Discover how our services can help.',
            company: options.companyName || 'Flexoraa',
        };
    }

    /**
     * Track token usage per tenant (for cost controls)
     */
    trackTokenUsage(tenantId, tokens) {
        if (!tenantId) return;

        const today = new Date().toISOString().split('T')[0];
        const key = `${tenantId}:${today}`;

        const current = this.tokenUsage.get(key) || 0;
        const newTotal = current + tokens;
        this.tokenUsage.set(key, newTotal);

        // Check thresholds
        if (newTotal >= this.dailyLimit) {
            logger.warn({ tenantId, tokens: newTotal }, 'Gemini daily token limit exceeded');
            // TODO: Trigger alert to Slack
        } else if (newTotal >= this.alertThreshold) {
            logger.warn({ tenantId, tokens: newTotal }, 'Gemini token usage approaching limit');
        }

        logger.debug({ tenantId, tokens, total: newTotal }, 'Gemini token usage tracked');
    }

    /**
     * Get token usage stats for a tenant
     */
    getTokenUsage(tenantId) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${tenantId}:${today}`;
        return {
            used: this.tokenUsage.get(key) || 0,
            limit: this.dailyLimit,
            remaining: this.dailyLimit - (this.tokenUsage.get(key) || 0),
        };
    }
}

module.exports = new GeminiService();

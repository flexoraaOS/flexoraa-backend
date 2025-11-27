// Google Gemini AI Service
// Real implementation using @google/generative-ai
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');
const logger = require('../../utils/logger');

class GeminiService {
    constructor() {
        this.enabled = config.ENABLE_AI_SERVICES;
        this.apiKey = config.GEMINI_API_KEY;
        this.client = null;
        this.models = {};

        // Token usage tracking (in-memory for now, could be Redis)
        this.tokenUsage = new Map(); // tenantId -> { used: number, limit: number }

        if (this.enabled && this.apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(this.apiKey);
                this.client = genAI;
                this.models = {
                    text: genAI.getGenerativeModel({ model: 'gemini-pro' }),
                    vision: genAI.getGenerativeModel({ model: 'gemini-pro-vision' }),
                    embedding: genAI.getGenerativeModel({ model: 'embedding-001' }),
                };
                logger.info('✨ Gemini AI service initialized');
            } catch (error) {
                logger.error({ err: error }, 'Failed to initialize Gemini client');
            }
        } else {
            logger.warn('Gemini AI service disabled or missing API key');
        }
    }

    /**
     * Generate text from prompt
     * @param {string} prompt - Input text
     * @param {Object} options - { tenantId, temperature, maxTokens }
     */
    async generateText(prompt, options = {}) {
        const { tenantId = 'default', temperature = 0.7, maxTokens = 500 } = options;

        if (!this.enabled || !this.client) {
            logger.info({ tenantId }, 'Gemini generateText (stub)');
            return {
                text: `[STUB] AI response to: "${prompt.substring(0, 20)}..."`,
                tokenCount: 10,
                model: 'stub-model',
            };
        }

        try {
            // Check limits
            this._checkLimits(tenantId);

            const model = this.models.text;
            const generationConfig = {
                temperature,
                maxOutputTokens: maxTokens,
            };

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
            });

            const response = await result.response;
            const text = response.text();

            // Estimate tokens (Gemini doesn't always return exact count in response)
            // Rule of thumb: 1 token ≈ 4 chars
            const inputTokens = Math.ceil(prompt.length / 4);
            const outputTokens = Math.ceil(text.length / 4);
            const totalTokens = inputTokens + outputTokens;

            // Track usage
            this._trackUsage(tenantId, totalTokens);

            return {
                text,
                tokenCount: totalTokens,
                model: 'gemini-pro',
            };
        } catch (error) {
            logger.error({ err: error, tenantId }, 'Gemini generation failed');
            throw error;
        }
    }

    /**
        try {
            const result = await this.generateText(jsonPrompt, { tenantId, temperature: 0.2 });

            // Clean up response (remove markdown if present)
            let cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanText);
        } catch (error) {
            logger.error({ err: error, text: result?.text }, 'Failed to parse structured AI response');
            throw new Error('AI failed to generate valid JSON');
        }
    }

    /**
     * Generate embeddings for RAG
     * @param {string} text 
     */
    async getEmbeddings(text) {
        if (!this.enabled || !this.client) {
            return new Array(768).fill(0.1); // Stub vector
        }

        try {
            const model = this.models.embedding;
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            logger.error({ err: error }, 'Embedding generation failed');
            throw error;
        }
    }

    /**
     * Track token usage
     */
    _trackUsage(tenantId, tokens) {
        const current = this.tokenUsage.get(tenantId) || { used: 0, limit: 100000 };
        current.used += tokens;
        this.tokenUsage.set(tenantId, current);

        // Log if approaching limit
        if (current.used > current.limit * 0.9) {
            logger.warn({ tenantId, used: current.used, limit: current.limit }, 'Tenant approaching AI token limit');
        }
    }

    /**
     * Check if tenant has exceeded limits
     */
    _checkLimits(tenantId) {
        const usage = this.tokenUsage.get(tenantId);
        if (usage && usage.used >= usage.limit) {
            throw new Error(`AI token limit exceeded for tenant ${tenantId}`);
        }
    }

    /**
     * Get current usage stats
     */
    getTokenUsage(tenantId) {
        return this.tokenUsage.get(tenantId) || { used: 0, limit: 100000 };
    }
}

module.exports = new GeminiService();

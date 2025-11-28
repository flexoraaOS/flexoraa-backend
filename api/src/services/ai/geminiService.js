// Google Gemini AI Service with Emergency Kill-Switch
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');
const logger = require('../../utils/logger');

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || 'stub-key');

class GeminiService {
    /**
     * Generate text using Gemini
     */
    async generateText(prompt, options = {}) {
        const { maxTokens = 512, temperature = 0.7 } = options;

        // Check emergency kill-switch
        try {
            const redis = require('../../middleware/rateLimiter').redis;
            const aiDisabled = await redis.get('ai:emergency_disabled');

            if (aiDisabled) {
                logger.warn('AI call blocked - emergency kill-switch active');
                return this.getTemplateFallback(prompt);
            }
        } catch (error) {
            logger.error({ err: error }, 'Failed to check AI kill-switch');
        }

        if (!config.GEMINI_API_KEY) {
            logger.warn('Gemini API key not configured, using fallback');
            return this.getTemplateFallback(prompt);
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature
                }
            });

            const response = result.response;
            const text = response.text();

            this.logTokenUsage('gemini-pro', prompt, text);

            return text;
        } catch (error) {
            logger.error({ err: error }, 'Gemini API call failed');
            // Graceful fallback
            return this.getTemplateFallback(prompt);
        }
    }

    /**
     * Template fallback when AI is disabled or fails
     */
    getTemplateFallback(prompt) {
        const templates = {
            lead_scoring: 'Thank you for your interest. Our team will contact you shortly.',
            chat_response: 'We have received your message. A team member will respond within 24 hours.',
            marketing: 'Discover our latest offerings. Contact us for more details.',
            default: 'Thank you for reaching out. We will get back to you soon.'
        };

        // Simple pattern matching for template selection
        if (prompt.toLowerCase().includes('score')) return templates.lead_scoring;
        if (prompt.toLowerCase().includes('chat') || prompt.toLowerCase().includes('reply')) return templates.chat_response;
        if (prompt.toLowerCase().includes('marketing')) return templates.marketing;

        return templates.default;
    }

    /**
     * Generate embeddings for RAG
     */
    async getEmbeddings(text) {
        if (!config.GEMINI_API_KEY) {
            return new Array(768).fill(0.1); // Stub vector
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'embedding-001' });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            logger.error({ err: error }, 'Embedding generation failed');
            throw error;
        }
    }

    /**
     * Log token usage for cost tracking
     */
    logTokenUsage(model, input, output) {
        const inputTokens = Math.ceil(input.length / 4);
        const outputTokens = Math.ceil(output.length / 4);
        logger.info({
            model,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens
        }, 'AI token usage');
    }
}

module.exports = new GeminiService();

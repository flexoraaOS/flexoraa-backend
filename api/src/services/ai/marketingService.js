const OpenAI = require('openai');
const logger = require('../../utils/logger');
const { retryWithBackoff } = require('../../utils/retryWrapper');
const { createCircuitBreaker } = require('../../utils/circuitBreaker');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 0 // We handle retries ourselves
});

// Create circuit breaker for OpenAI calls
const openaiBreaker = createCircuitBreaker(
    async (prompt, options) => {
        return await openai.chat.completions.create({
            model: options.model || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.max_tokens || 300,
            temperature: options.temperature || 0.7
        });
    },
    {
        name: 'openai-marketing',
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
    }
);

/**
 * Generate marketing content using ChatGPT with circuit breaker protection
 * 
 * UPDATED: Now includes circuit breaker to prevent cascading failures
 */
async function generateMarketingContent({ name, description, phone_number }) {
    try {
        const prompt = `Return ONLY valid JSON in this format:
{
  "phone_number": "+911234567890",
  "output": "Your generated text here",
  "company": "Company Name"
}
Do not wrap inside "output" or any other object.
you are a marketing agent for ${name} so create a catchy 1 liner to attract customers.

Context:
- Company: ${name}
- Description: ${description}
- Phone: ${phone_number}`;

        // Use circuit breaker + retry wrapper
        const response = await retryWithBackoff(
            async () => await openaiBreaker.fire(prompt, { max_tokens: 300 }),
            {
                maxRetries: 3,
                onRetry: (attempt, delay, error) => {
                    logger.warn('AI marketing retry', { attempt, delay, error: error.message, name });
                }
            }
        );

        const content = response.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            return {
                phone_number: parsed.phone_number || phone_number,
                output: parsed.output || '',
                company: parsed.company || name
            };
        } catch (parseError) {
            return {
                phone_number,
                output: content,
                company: name
            };
        }

    } catch (error) {
        // Check if circuit is open
        if (error.message && error.message.includes('breaker is open')) {
            logger.error('Marketing content generation failed - circuit open', { name });
        } else {
            logger.error('Marketing content generation failed', { error, name });
        }

        // Return defaults (continueOnError behavior)
        return {
            phone_number: phone_number || '',
            output: '',
            company: name || ''
        };
    }
}

module.exports = { generateMarketingContent, openaiBreaker };

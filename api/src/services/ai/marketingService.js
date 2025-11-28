const OpenAI = require('openai');
const logger = require('../../utils/logger');
const { getChatMemory, saveChatMessage } = require('./chatMemoryService');
const { retryWithBackoff } = require('../../utils/retryWrapper');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate marketing content using ChatGPT (WITH RETRY)
 * Implements n8n "AI Agent1" node logic:
 * - Prompt template with variable interpolation
 * - Structured JSON output
 * - Max tokens: 300
 * - continueOnError behavior
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

        const response = await retryWithBackoff(
            async () => {
                return await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 300,
                    temperature: 0.7
                });
            },
            {
                maxRetries: 3,
                onRetry: (attempt, delay, error) => {
                    logger.warn('AI marketing retry', { attempt, delay, error: error.message, name });
                }
            }
        );

        const content = response.choices[0].message.content;

        // Parse structured output
        try {
            const parsed = JSON.parse(content);
            return {
                phone_number: parsed.phone_number || phone_number,
                output: parsed.output || '',
                company: parsed.company || name
            };
        } catch (parseError) {
            // Fallback if AI doesn't return valid JSON
            return {
                phone_number,
                output: content, // Use raw content
                company: name
            };
        }

    } catch (error) {
        // continueOnError behavior - return defaults
        logger.error('Marketing content generation failed', { error, name });
        return {
            phone_number: phone_number || '',
            output: '',
            company: name || ''
        };
    }
}

module.exports = { generateMarketingContent };

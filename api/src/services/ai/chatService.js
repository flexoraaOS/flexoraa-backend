const OpenAI = require('openai');
const logger = require('../../utils/logger');
const { getChatMemory, saveChatMessage } = require('./chatMemoryService');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate AI chat reply
 * Implements n8n "AI Agent" node logic from Workflow 2:
 * - Context-aware responses using chat memory
 * - Lead and campaign context injection
 * - Max tokens: 200
 * - continueOnError behavior
 */
async function generateAIReply({ userMessage, phoneNumber, leadContext, campaignContext }) {
    try {
        // Get chat history (matches "Simple Memory" node)
        const chatHistory = await getChatMemory(phoneNumber);

        // Build context-aware prompt
        const systemPrompt = `You are a helpful assistant for ${campaignContext.name || 'our company'}.

Lead Information:
- Name: ${leadContext.name || 'Unknown'}
- Status: ${leadContext.status || 'new'}

Campaign Context:
- Campaign: ${campaignContext.name || 'General'}
- Description: ${campaignContext.description || 'N/A'}

Previous conversation:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Create a simple, helpful reply to the user's message.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const aiReply = response.choices[0].message.content;

        // Save to chat memory
        await saveChatMessage(phoneNumber, 'user', userMessage);
        await saveChatMessage(phoneNumber, 'assistant', aiReply);

        return aiReply;

    } catch (error) {
        // continueOnError behavior
        logger.error('AI chat failed', { error, phoneNumber });
        return 'Thank you for your message. We will get back to you soon.'; // Default response
    }
}

module.exports = { generateAIReply };

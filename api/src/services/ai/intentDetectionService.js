const { generateContent } = require('./geminiService');
const logger = require('../../utils/logger');

class IntentDetectionService {
    /**
     * Detect intent and emotional tone from message
     * Categories: Buying intent, Confusion, Support, Objection, Urgency, Information, Competitor, Follow-up
     * Emotional tone: Frustrated, Excited, Skeptical
     */
    async detectIntent(messageText) {
        try {
            const prompt = `Analyze this customer message and provide:
1. Primary Intent (one of: buying_intent, confusion, support, objection, urgency, information, competitor_inquiry, follow_up)
2. Emotional Tone (one of: frustrated, excited, skeptical, neutral, positive, negative)
3. Confidence (0-1)
4. Objection detected (yes/no)
5. Buying signals (yes/no)

Message: "${messageText}"

Respond in JSON format:
{
  "intent": "buying_intent",
  "emotionalTone": "excited",
  "confidence": 0.95,
  "hasObjection": false,
  "hasBuyingSignal": true,
  "reasoning": "Customer is asking about pricing and availability, showing readiness to purchase"
}`;

            const response = await generateContent(prompt);
            const result = JSON.parse(response);

            logger.info({ messageText, result }, 'Intent detected');

            return {
                intent: result.intent,
                emotionalTone: result.emotionalTone,
                confidence: result.confidence,
                hasObjection: result.hasObjection,
                hasBuyingSignal: result.hasBuyingSignal,
                reasoning: result.reasoning
            };

        } catch (error) {
            logger.error({ err: error, messageText }, 'Intent detection failed');

            // Fallback to basic keyword matching
            return this._fallbackIntent(messageText);
        }
    }

    _fallbackIntent(messageText) {
        const text = messageText.toLowerCase();

        // Buying signals
        const buyingKeywords = ['buy', 'purchase', 'price', 'cost', 'order', 'subscribe', 'sign up'];
        const hasBuyingSignal = buyingKeywords.some(kw => text.includes(kw));

        // Objections
        const objectionKeywords = ['too expensive', 'not sure', 'maybe later', 'think about it', 'not interested'];
        const hasObjection = objectionKeywords.some(kw => text.includes(kw));

        // Urgency
        const urgencyKeywords = ['urgent', 'asap', 'immediately', 'now', 'today'];
        const hasUrgency = urgencyKeywords.some(kw => text.includes(kw));

        let intent = 'information';
        if (hasBuyingSignal) intent = 'buying_intent';
        else if (hasObjection) intent = 'objection';
        else if (hasUrgency) intent = 'urgency';

        return {
            intent,
            emotionalTone: 'neutral',
            confidence: 0.5,
            hasObjection,
            hasBuyingSignal,
            reasoning: 'Fallback keyword matching'
        };
    }
}

module.exports = new IntentDetectionService();

const { generateContent } = require('./geminiService');
const logger = require('../../utils/logger');

class TranslationService {
    /**
     * Translate text to target language using AI
     * @param {string} text 
     * @param {string} targetLanguage 
     */
    async translate(text, targetLanguage) {
        try {
            const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no explanations.\n\nText: "${text}"`;

            const translation = await generateContent(prompt);
            return translation.trim();
        } catch (error) {
            logger.error({ err: error, text, targetLanguage }, 'Translation failed');
            // Fallback: return original text
            return text;
        }
    }

    /**
     * Detect language of text
     * @param {string} text 
     */
    async detectLanguage(text) {
        try {
            const prompt = `Detect the language of the following text. Return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'de').\n\nText: "${text}"`;

            const code = await generateContent(prompt);
            return code.trim().toLowerCase();
        } catch (error) {
            logger.error({ err: error }, 'Language detection failed');
            return 'en'; // Default
        }
    }
}

module.exports = new TranslationService();

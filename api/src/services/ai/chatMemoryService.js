const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Chat Memory Service
 * Implements n8n "Postgres Chat Memory" and "Simple Memory" nodes:
 * - Session storage by phone_number
 * - Message history retrieval
 * - Context preservation across requests
 */

/**
 * Get chat history for a phone number
 */
async function getChatMemory(phoneNumber) {
    try {
        const result = await db.query(
            `SELECT role, content, created_at 
       FROM n8n_chat_histories 
       WHERE phone_number = $1 
       ORDER BY created_at ASC`,
            [phoneNumber]
        );

        return result.rows.map(row => ({
            role: row.role,
            content: row.content,
            timestamp: row.created_at
        }));
    } catch (error) {
        logger.error('Error retrieving chat memory', { error, phoneNumber });
        return []; //Return empty history on error
    }
}

/**
 * Save a message to chat history
 */
async function saveChatMessage(phoneNumber, role, content) {
    try {
        await db.query(
            `INSERT INTO n8n_chat_histories (phone_number, role, content, created_at)
       VALUES ($1, $2, $3, NOW())`,
            [phoneNumber, role, content]
        );
        logger.info('Chat message saved', { phoneNumber, role });
    } catch (error) {
        logger.error('Error saving chat message', { error, phoneNumber });
        // Don't throw - continue on error
    }
}

/**
 * Clear chat history for a phone number (optional)
 */
async function clearChatMemory(phoneNumber) {
    try {
        await db.query(
            'DELETE FROM n8n_chat_histories WHERE phone_number = $1',
            [phoneNumber]
        );
        logger.info('Chat memory cleared', { phoneNumber });
    } catch (error) {
        logger.error('Error clearing chat memory', { error, phoneNumber });
    }
}

module.exports = {
    getChatMemory,
    saveChatMessage,
    clearChatMemory
};

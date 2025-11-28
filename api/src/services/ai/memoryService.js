// Chat Memory Service
// Postgres-backed conversation history
const db = require('../../config/database');
const logger = require('../../utils/logger');

class MemoryService {
    /**
     * Get recent chat history for a session
     * @param {string} sessionId - Session ID (phone number or user ID)
     * @param {number} limit - Number of messages to retrieve
     */
    async getChatHistory(sessionId, limit = 10) {
        try {
            const result = await db.query(
                `SELECT role, content, created_at 
         FROM chat_memory 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
                [sessionId, limit]
            );

            // Return in chronological order (oldest first)
            return result.rows.reverse();
        } catch (error) {
            logger.error({ err: error, sessionId }, 'Failed to get chat history');
            throw error;
        }
    }

    /**
     * Add message to chat memory
     */
    async addMessage(tenantId, sessionId, role, content, tokenCount = null) {
        try {
            const result = await db.query(
                'SELECT add_chat_message($1, $2, $3, $4, $5)',
                [tenantId, sessionId, role, content, tokenCount]
            );

            logger.debug({ sessionId, role }, 'Message added to chat memory');
            return result.rows[0].add_chat_message;
        } catch (error) {
            logger.error({ err: error, sessionId }, 'Failed to add chat message');
            throw error;
        }
    }

    /**
     * Get token usage stats for a session
     */
    async getTokenUsage(sessionId) {
        try {
            const result = await db.query(
                `SELECT 
          COUNT(*) as message_count,
          SUM(token_count) as total_tokens,
          MAX(created_at) as last_interaction
         FROM chat_memory 
         WHERE session_id = $1 AND token_count IS NOT NULL`,
                [sessionId]
            );

            return result.rows[0];
        } catch (error) {
            logger.error({ err: error, sessionId }, 'Failed to get token usage');
            return { message_count: 0, total_tokens: 0 };
        }
    }

    /**
     * Clear old chat history (cleanup job)
     */
    async cleanup(daysToRetain = 90) {
        try {
            const result = await db.query(
                'SELECT cleanup_old_chat_memory($1)',
                [daysToRetain]
            );

            const deleted = result.rows[0].cleanup_old_chat_memory;
            logger.info({ deleted, daysToRetain }, 'Chat memory cleanup completed');
            return deleted;
        } catch (error) {
            logger.error({ err: error }, 'Chat memory cleanup failed');
            throw error;
        }
    }
}

module.exports = new MemoryService();

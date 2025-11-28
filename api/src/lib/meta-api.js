// Temporary stub for getMessageHistory
// TODO: Move to supabaseService or create dedicated service

/**
 * Get message history for a lead
 */
async function getMessageHistory(userId, leadId, limit = 50) {
    // For now, return empty array
    // This should query contact_history table once implemented
    return [];
}

module.exports = {
    getMessageHistory
};

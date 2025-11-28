/**
 * Conditional Router Utility
 * Handles logic for routing messages based on conditions (e.g. cancellation)
 */

const logger = require('./logger');

/**
 * Check if a message indicates cancellation
 * @param {string} message - The message text
 * @returns {boolean} - True if cancellation detected
 */
const checkCancellation = (message) => {
    if (!message) return false;
    const lower = message.toLowerCase().trim();
    return ['stop', 'cancel', 'unsubscribe', 'end'].includes(lower);
};

module.exports = {
    checkCancellation
};

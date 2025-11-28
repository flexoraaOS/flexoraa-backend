/**
 * Conditional router
 * Implements n8n "Switch" node logic for cancellation check
 */

function checkCancellation(normalizedMessage) {
    // Branch 1: Message starts with "stop" → CANCEL
    if (normalizedMessage.startsWith('stop')) {
        return 'CANCEL';
    }

    // Branch 0: Message does NOT start with "stop" → CONTINUE
    return 'CONTINUE';
}

module.exports = { checkCancellation };

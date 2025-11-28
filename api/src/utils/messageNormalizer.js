/**
 * Message normalizer
 * Matches n8n expression:
 * {{ $json.messages[0].text.body.toLowerCase().replace(/\\s+/g, '') }}
 */

function normalizeMessage(text) {
    if (!text) return '';
    // 1. Convert to lowercase
    // 2. Remove ALL whitespace (spaces, tabs, newlines)
    return text.toLowerCase().replace(/\s+/g, '');
}

module.exports = { normalizeMessage };

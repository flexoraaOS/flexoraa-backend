// Encryption Utility
// Encryption Utility
// Uses AES-256-GCM for authenticated encryption
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get the encryption key (lazily)
 */
function getKey() {
    if (!config.ENCRYPTION_KEY) {
        throw new Error('Encryption key not configured');
    }

    // Handle hex string vs raw string
    if (config.ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(config.ENCRYPTION_KEY)) {
        return Buffer.from(config.ENCRYPTION_KEY, 'hex');
    }
    // Fallback: hash the string to get 32 bytes
    return crypto.createHash('sha256').update(config.ENCRYPTION_KEY).digest();
}

/**
 * Encrypt text
 * Returns format: iv:authTag:encryptedText (hex encoded)
 */
function encrypt(text) {
    if (!text) return text;

    try {
        const key = getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        logger.error({ err: error }, 'Encryption failed');
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt text
 * Expects format: iv:authTag:encryptedText
 */
function decrypt(text) {
    if (!text) return text;
    if (!text.includes(':')) return text; // Assume not encrypted if format doesn't match

    try {
        const key = getKey();
        const parts = text.split(':');
        if (parts.length !== 3) return text;

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error({ err: error }, 'Decryption failed');
        return text;
    }
}

/**
 * Create deterministic hash for blind indexing (searching)
 * Uses SHA-256 with the encryption key as salt (HMAC)
 */
function hash(text) {
    if (!text) return text;
    try {
        const key = getKey();
        return crypto.createHmac('sha256', key).update(text).digest('hex');
    } catch (error) {
        logger.error({ err: error }, 'Hashing failed');
        throw error;
    }
}

module.exports = {
    encrypt,
    decrypt,
    hash
};

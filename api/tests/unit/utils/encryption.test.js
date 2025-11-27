// Unit Test: Encryption Utility
const encryption = require('../../../src/utils/encryption');
const config = require('../../../src/config/env');

// Mock config if needed, but we rely on setup.js usually. 
// For this test, we need to ensure ENCRYPTION_KEY is set.
// We'll assume the setup.js or env.js handles defaults or we mock it.

describe('Encryption Utility', () => {
    // Ensure we have a key for testing
    beforeAll(() => {
        if (!config.ENCRYPTION_KEY) {
            config.ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000'; // 32 bytes hex
        }
    });

    it('should encrypt and decrypt text correctly', () => {
        const original = 'sensitive-pii-data';
        const encrypted = encryption.encrypt(original);

        expect(encrypted).not.toBe(original);
        expect(encrypted).toContain(':'); // IV:Tag:Content format

        const decrypted = encryption.decrypt(encrypted);
        expect(decrypted).toBe(original);
    });

    it('should return null/undefined if input is null/undefined', () => {
        expect(encryption.encrypt(null)).toBeNull();
        expect(encryption.decrypt(undefined)).toBeUndefined();
    });

    it('should return original text if decryption format is invalid (legacy support)', () => {
        const plain = 'not-encrypted';
        const result = encryption.decrypt(plain);
        expect(result).toBe(plain);
    });

    it('should generate different ciphertexts for same input (random IV)', () => {
        const text = 'same-text';
        const enc1 = encryption.encrypt(text);
        const enc2 = encryption.encrypt(text);

        expect(enc1).not.toBe(enc2);
        expect(encryption.decrypt(enc1)).toBe(text);
        expect(encryption.decrypt(enc2)).toBe(text);
    });
});

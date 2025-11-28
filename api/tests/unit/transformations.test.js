const { formatPhoneNumber } = require('../../src/utils/phoneFormatter');
const { normalizeMessage } = require('../../src/utils/messageNormalizer');
const { checkCancellation } = require('../../src/utils/conditionalRouter');

describe('Data transformations', () => {
    describe('Phone formatting', () => {
        test('should replace 00 with +', () => {
            expect(formatPhoneNumber('00491234567890')).toBe('+491234567890');
        });

        test('should keep + prefix', () => {
            expect(formatPhoneNumber('+491234567890')).toBe('+491234567890');
        });

        test('should handle empty', () => {
            expect(formatPhoneNumber('')).toBe('');
        });
    });

    describe('Message normalization', () => {
        test('should lowercase and remove spaces', () => {
            expect(normalizeMessage('STOP NOW')).toBe('stopnow');
        });

        test('should remove all whitespace', () => {
            expect(normalizeMessage('S T O P')).toBe('stop');
        });

        test('should handle tabs and newlines', () => {
            expect(normalizeMessage('Stop\n\tPlease')).toBe('stopplease');
        });
    });

    describe('Cancellation check', () => {
        test('should detect STOP', () => {
            expect(checkCancellation('stop')).toBe('CANCEL');
            expect(checkCancellation('stopnow')).toBe('CANCEL');
            expect(checkCancellation('stopit')).toBe('CANCEL');
        });

        test('should NOT cancel other messages', () => {
            expect(checkCancellation('hello')).toBe('CONTINUE');
            expect(checkCancellation('nostop')).toBe('CONTINUE');
        });
    });
});

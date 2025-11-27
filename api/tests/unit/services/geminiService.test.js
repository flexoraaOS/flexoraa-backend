// Sample Unit Test: Gemini Service
const geminiService = require('../../../src/services/ai/geminiService');

describe('Gemini Service', () => {
    describe('generateText', () => {
        it('should return stub response when disabled', async () => {
            const result = await geminiService.generateText('Test prompt');

            expect(result).toHaveProperty('text');
            expect(result).toHaveProperty('tokenCount');
            expect(result.text).toContain('[STUB]');
        });

        it('should track token usage per tenant', async () => {
            const tenantId = 'test-tenant-123';
            await geminiService.generateText('Test prompt', { tenantId });

            const usage = geminiService.getTokenUsage(tenantId);
            expect(usage.used).toBeGreaterThan(0);
            expect(usage.limit).toBe(100000);
        });
    });

    describe('generateStructured', () => {
        it('should return structured JSON output', async () => {
            const result = await geminiService.generateStructured(
                'Generate marketing copy',
                {},
                { phoneNumber: '+910000000000', companyName: 'Test Co' }
            );

            expect(result).toHaveProperty('phone_number');
            expect(result).toHaveProperty('output');
            expect(result).toHaveProperty('company');
        });
    });
});

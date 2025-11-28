// Unit Test: Scoring Service
const scoringService = require('../../../src/services/scoring/scoringService');
const geminiService = require('../../../src/services/ai/geminiService');

jest.mock('../../../src/services/ai/geminiService');

describe('Scoring Service', () => {
    const mockLead = {
        id: '123',
        name: 'Test Lead',
        phone_number: '+919876543210',
        message: 'I want to buy your product immediately. What is the price?',
        status: 'pending',
        has_whatsapp: true,
        temperature: 'HOT',
        metadata: {
            response_time_ms: 1800000, // 30 mins
            interaction_count: 3
        },
        contacted: false
    };

    describe('calculateDeterministicScore', () => {
        it('should calculate score based on deterministic rules', () => {
            const result = scoringService.calculateDeterministicScore(mockLead);

            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('maxScore', 100);
            expect(result).toHaveProperty('explanations');
            expect(result.explanations).toBeInstanceOf(Array);
            expect(result.score).toBeGreaterThan(0);
        });

        it('should award points for fast response time', () => {
            const fastLead = { ...mockLead, metadata: { response_time_ms: 1800000 } }; // < 1 hour
            const result = scoringService.calculateDeterministicScore(fastLead);

            expect(result.explanations.some(e => e.includes('Response time'))).toBe(true);
        });

        it('should award points for buying intent keywords', () => {
            const result = scoringService.calculateDeterministicScore(mockLead);
            expect(result.explanations.some(e => e.includes('intent'))).toBe(true);
        });

        it('should award points for HOT temperature', () => {
            const result = scoringService.calculateDeterministicScore(mockLead);
            expect(result.explanations.some(e => e.includes('temperature'))).toBe(true);
        });
    });

    describe('scoreLead', () => {
        beforeEach(() => {
            geminiService.generateText.mockResolvedValue('Lead shows strong buying signals, score: 25/30');
        });

        it('should return comprehensive score with AI and deterministic breakdown', async () => {
            const result = await scoringService.scoreLead(mockLead, { includeAI: true });

            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('category');
            expect(result).toHaveProperty('breakdown');
            expect(result.breakdown).toHaveProperty('deterministic');
            expect(result.breakdown).toHaveProperty('ai');
            expect(result.category).toMatch(/HOT|WARM|COLD/);
        });

        it('should categorize high scores as HOT', async () => {
            const result = await scoringService.scoreLead(mockLead, { includeAI: true });
            expect(result.category).toBe('HOT');
        });

        it('should skip AI scoring when includeAI is false', async () => {
            const result = await scoringService.scoreLead(mockLead, { includeAI: false });

            expect(result.breakdown.ai.score).toBe(0);
            expect(geminiService.generateText).not.toHaveBeenCalled();
        });
    });

    describe('scoreLeads (batch)', () => {
        it('should score multiple leads', async () => {
            geminiService.generateText.mockResolvedValue('Score: 20/30');

            const leads = [mockLead, { ...mockLead, id: '456' }];
            const results = await scoringService.scoreLeads(leads, { includeAI: false });

            expect(results).toHaveLength(2);
            expect(results[0]).toHaveProperty('leadId', '123');
            expect(results[1]).toHaveProperty('leadId', '456');
        });
    });
});

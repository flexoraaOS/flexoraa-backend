const { mergeByField } = require('../../src/utils/mergeData');

describe('Merge utility', () => {
    test('should merge arrays by user_id', () => {
        const leads = [
            { user_id: '1', name: 'Lead 1', phone: '+1234' },
            { user_id: '2', name: 'Lead 2', phone: '+5678' }
        ];

        const campaigns = [
            { user_id: '1', description: 'Campaign A' },
            { user_id: '2', description: 'Campaign B' }
        ];

        const result = mergeByField(leads, campaigns, 'user_id');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ user_id: '1', name: 'Lead 1', phone: '+1234', description: 'Campaign A' });
    });

    test('should handle keepEverything (LEFT JOIN)', () => {
        const leads = [
            { user_id: '1', name: 'Lead 1' },
            { user_id: '2', name: 'Lead 2' },
            { user_id: '3', name: 'Lead 3' }
        ];

        const campaigns = [
            { user_id: '1', description: 'Campaign A' }
        ];

        const result = mergeByField(leads, campaigns, 'user_id');

        expect(result).toHaveLength(3);
        expect(result[0].description).toBe('Campaign A');
        expect(result[1].description).toBeUndefined();
        expect(result[2].description).toBeUndefined();
    });
});

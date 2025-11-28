const { evaluateExpression, interpolateTemplate } = require('../../src/utils/expressionEngine');

describe('Expression Engine', () => {
    test('should evaluate $json.field', () => {
        const context = {
            $json: { name: 'John', age: 30 }
        };

        const result = evaluateExpression('={{ $json.name }}', context);
        expect(result).toBe('John');
    });

    test('should handle nested paths', () => {
        const context = {
            $json: {
                user: { profile: { name: 'Alice' } }
            }
        };

        const result = evaluateExpression('={{ $json.user.profile.name }}', context);
        expect(result).toBe('Alice');
    });

    test('should handle array access', () => {
        const context = {
            $json: {
                messages: [
                    { from: '+1234', text: { body: 'Hello' } }
                ]
            }
        };

        const result = evaluateExpression('={{ $json.messages[0].from }}', context);
        expect(result).toBe('+1234');
    });

    test('should interpolate templates', () => {
        const context = {
            $json: { firstName: 'John', lastName: 'Doe' }
        };

        const result = interpolateTemplate('Hello {{ $json.firstName }} {{ $json.lastName }}!', context);
        expect(result).toBe('Hello John Doe!');
    });

    test('should return original if no expression', () => {
        const result = evaluateExpression('plain text', {});
        expect(result).toBe('plain text');
    });
});

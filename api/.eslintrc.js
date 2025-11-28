module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-undef': 'error',
        'semi': ['error', 'always'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'comma-dangle': ['error', 'never'],
        'arrow-spacing': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'eqeqeq': ['error', 'always'],
        'no-duplicate-imports': 'error'
    }
};

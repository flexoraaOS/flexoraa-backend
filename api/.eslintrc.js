// ESLint Configuration
module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'airbnb-base',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'no-console': 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'consistent-return': 'off',
    },
};

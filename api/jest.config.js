// Jest Configuration
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js',
        '!**/node_modules/**',
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    testMatch: [
        '**/tests/unit/**/*.test.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true,
};

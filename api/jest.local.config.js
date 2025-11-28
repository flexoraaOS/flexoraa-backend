module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./tests/setup/local.js'],
    testMatch: ['**/tests/local/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js'
    ],
    coverageDirectory: 'coverage/local',
    verbose: true
};

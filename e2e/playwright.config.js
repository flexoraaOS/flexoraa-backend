const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: false, // Run tests sequentially for E2E
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }]
    ],

    use: {
        baseURL: process.env.API_URL || 'http://localhost:4000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15000,
    },

    projects: [
        {
            name: 'staging',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.STAGING_URL || 'https://api-staging.flexoraa.com',
            },
        },
        {
            name: 'production',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: 'https://api.flexoraa.com',
            },
        },
    ],

    webServer: process.env.CI ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:4000/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});

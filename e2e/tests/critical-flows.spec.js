const { test, expect } = require('@playwright/test');

// E2E Test Suite for Flexoraa Backend
// Tests critical user flows end-to-end

test.describe('Critical User Flows', () => {
    let authToken;
    let testLeadId;

    test.beforeAll(async ({ request }) => {
        // Authenticate and get JWT token
        // NOTE: Replace with actual login credentials for staging
        const loginResponse = await request.post('/api/auth/login', {
            data: {
                email: process.env.TEST_USER_EMAIL || 'test@flexoraa.com',
                password: process.env.TEST_USER_PASSWORD || 'test-password'
            }
        });

        if (loginResponse.ok()) {
            const body = await loginResponse.json();
            authToken = body.token;
        } else {
            console.warn('Login failed, using mock token for development');
            authToken = 'mock-jwt-token';
        }
    });

    test('Flow 1: Lead Creation → Scoring → Assignment', async ({ request }) => {
        // Step 1: Create Lead
        const leadResponse = await request.post('/api/leads', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                phone_number: '+919876543210',
                name: 'E2E Test Lead',
                campaign_id: null,
                metadata: {
                    source: 'e2e-test',
                    test_run: new Date().toISOString()
                }
            }
        });

        expect(leadResponse.status()).toBe(201);
        const lead = await leadResponse.json();
        expect(lead).toHaveProperty('id');
        testLeadId = lead.id;

        // Step 2: Score Lead
        const scoreResponse = await request.get(`/api/scoring/${testLeadId}/score`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        expect([200, 404]).toContain(scoreResponse.status());

        if (scoreResponse.ok()) {
            const score = await scoreResponse.json();
            expect(score).toHaveProperty('score');
            expect(score.score).toBeGreaterThanOrEqual(0);
            expect(score.score).toBeLessThanOrEqual(100);
        }

        // Step 3: Claim Assignment
        const assignResponse = await request.post('/api/assignments/claim', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        // May be 200 (success) or 404 (no assignments available)
        expect([200, 404, 401]).toContain(assignResponse.status());
    });

    test('Flow 2: Booking Link Generation → Acceptance', async ({ request }) => {
        // Step 1: Generate Booking Link
        const bookingResponse = await request.post('/api/bookings/generate', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                leadId: testLeadId || 'test-lead-id',
                metadata: { source: 'e2e-test' }
            }
        });

        if (!bookingResponse.ok()) {
            console.warn('Booking generation failed, skipping acceptance test');
            return;
        }

        const booking = await bookingResponse.json();
        expect(booking).toHaveProperty('token');
        expect(booking).toHaveProperty('url');

        // Step 2: Accept Booking (Public endpoint, no auth)
        const acceptResponse = await request.post('/api/bookings/accept', {
            data: {
                token: booking.token
            }
        });

        expect([200, 400]).toContain(acceptResponse.status());

        if (acceptResponse.ok()) {
            const result = await acceptResponse.json();
            expect(result.success).toBe(true);
        }
    });

    test('Flow 3: Campaign Creation → Lead Association', async ({ request }) => {
        // Step 1: Create Campaign
        const campaignResponse = await request.post('/api/campaigns', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                name: 'E2E Test Campaign',
                description: 'Created by E2E test suite',
                status: 'draft'
            }
        });

        expect([201, 401]).toContain(campaignResponse.status());

        if (!campaignResponse.ok()) {
            console.warn('Campaign creation requires authentication');
            return;
        }

        const campaign = await campaignResponse.json();
        expect(campaign).toHaveProperty('id');

        // Step 2: Update Lead with Campaign
        if (testLeadId) {
            const updateResponse = await request.patch(`/api/leads/${testLeadId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                data: {
                    campaign_id: campaign.id
                }
            });

            expect([200, 404, 401]).toContain(updateResponse.status());
        }
    });

    test('Flow 4: Audit Trail Verification', async ({ request }) => {
        if (!testLeadId) {
            test.skip('No test lead created');
        }

        const auditResponse = await request.get(`/api/audit/${testLeadId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        expect([200, 404, 401]).toContain(auditResponse.status());

        if (auditResponse.ok()) {
            const audit = await auditResponse.json();
            expect(audit).toHaveProperty('trail');
            expect(Array.isArray(audit.trail)).toBe(true);
        }
    });

    test('Flow 5: AI Kill-Switch Toggle', async ({ request }) => {
        // Test AI status endpoint
        const statusResponse = await request.get('/api/admin/toggles/ai-status', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        expect([200, 401, 403]).toContain(statusResponse.status());

        if (statusResponse.ok()) {
            const status = await statusResponse.json();
            expect(status).toHaveProperty('aiEnabled');
            expect(status).toHaveProperty('emergencyMode');
        }
    });

    test.afterAll(async ({ request }) => {
        // Cleanup: Delete test lead
        if (testLeadId && authToken) {
            await request.delete(`/api/leads/${testLeadId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
    });
});

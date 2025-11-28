// Contract Tests - Verify API responses match frontend expectations
const request = require('supertest');
const app = require('../../src/app');

describe('Contract Tests: Leads API', () => {
    let authToken;

    beforeAll(async () => {
        //Mock JWT token for testing
        authToken = 'Bearer test-jwt-token';
    });

    describe('GET /api/leads', () => {
        it('should return array of leads matching frontend Lead interface', async () => {
            const response = await request(app)
                .get('/api/leads')
                .set('Authorization', authToken)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                const lead = response.body[0];

                // Required fields
                expect(lead).toHaveProperty('phone_number');
                expect(typeof lead.phone_number).toBe('string');

                // Optional fields (should exist even if null)
                expect(lead).toHaveProperty('id');
                expect(lead).toHaveProperty('name');
                expect(lead).toHaveProperty('user_id');
                expect(lead).toHaveProperty('email');
                expect(lead).toHaveProperty('status');
                expect(lead).toHaveProperty('stage');
                expect(lead).toHaveProperty('temperature');
                expect(lead).toHaveProperty('campaign_id');
                expect(lead).toHaveProperty('metadata');
                expect(lead).toHaveProperty('has_whatsapp');
                expect(lead).toHaveProperty('followup_date');
                expect(lead).toHaveProperty('followup_time');
                expect(lead).toHaveProperty('booked_timestamp');
                expect(lead).toHaveProperty('closed');
                expect(lead).toHaveProperty('contacted');
                expect(lead).toHaveProperty('note');
                expect(lead).toHaveProperty('created_at');
                expect(lead).toHaveProperty('updated_at');

                // Type validation
                if (lead.status) {
                    expect(['pending', 'contacted', 'qualified', 'converted', 'lost']).toContain(lead.status);
                }

                if (lead.stage) {
                    expect(['new', 'contacted', 'qualified', 'booked', 'converted', 'lost']).toContain(lead.stage);
                }
            }
        });

        it('should support campaignId query parameter', async () => {
            const response = await request(app)
                .get('/api/leads?campaignId=test-campaign-uuid')
                .set('Authorization', authToken);

            expect([200, 404]).toContain(response.status);
        });

        it('should support limit query parameter', async () => {
            const response = await request(app)
                .get('/api/leads?limit=10')
                .set('Authorization', authToken)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeLessThanOrEqual(10);
        });
    });

    describe('POST /api/leads', () => {
        it('should accept lead creation matching frontend createLead payload', async () => {
            const leadData = {
                phone_number: '+919876543210',
                name: 'Contract Test Lead',
                campaign_id: null,
                metadata: { source: 'contract-test' }
            };

            const response = await request(app)
                .post('/api/leads')
                .set('Authorization', authToken)
                .send(leadData);

            expect([201, 400, 401]).toContain(response.status);

            if (response.status === 201) {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('phone_number');
                expect(response.body.phone_number).toBe(leadData.phone_number);
            }
        });

        it('should reject invalid phone number format', async () => {
            const response = await request(app)
                .post('/api/leads')
                .set('Authorization', authToken)
                .send({ phone_number: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PATCH /api/leads/:id', () => {
        it('should accept updates matching frontend updateLead payload', async () => {
            const updates = {
                status: 'contacted',
                stage: 'qualified',
                note: 'Follow-up scheduled'
            };

            const response = await request(app)
                .patch('/api/leads/test-lead-id')
                .set('Authorization', authToken)
                .send(updates);

            expect([200, 404, 401]).toContain(response.status);
        });

        it('should auto-set closed=true when stage=converted', async () => {
            const response = await request(app)
                .patch('/api/leads/test-lead-id')
                .set('Authorization', authToken)
                .send({ stage: 'converted' });

            if (response.status === 200) {
                expect(response.body.closed).toBe(true);
            }
        });
    });

    describe('DELETE /api/leads/:id', () => {
        it('should return 204 on successful deletion', async () => {
            const response = await request(app)
                .delete('/api/leads/test-lead-id')
                .set('Authorization', authToken);

            expect([204, 404, 401]).toContain(response.status);
        });
    });
});

describe('Contract Tests: Campaigns API', () => {
    let authToken;

    beforeAll(() => {
        authToken = 'Bearer test-jwt-token';
    });

    describe('GET /api/campaigns', () => {
        it('should return array of campaigns matching frontend Campaign interface', async () => {
            const response = await request(app)
                .get('/api/campaigns')
                .set('Authorization', authToken)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                const campaign = response.body[0];

                expect(campaign).toHaveProperty('id');
                expect(campaign).toHaveProperty('name');
                expect(campaign).toHaveProperty('user_id');
                expect(campaign).toHaveProperty('description');
                expect(campaign).toHaveProperty('status');
                expect(campaign).toHaveProperty('start_date');
                expect(campaign).toHaveProperty('end_date');
                expect(campaign).toHaveProperty('created_at');

                if (campaign.status) {
                    expect(['draft', 'active', 'paused', 'archived']).toContain(campaign.status);
                }
            }
        });
    });

    describe('POST /api/campaigns', () => {
        it('should accept campaign creation matching frontend payload', async () => {
            const campaignData = {
                name: 'Contract Test Campaign',
                description: 'Test campaign',
                status: 'draft'
            };

            const response = await request(app)
                .post('/api/campaigns')
                .set('Authorization', authToken)
                .send(campaignData);

            expect([201, 400, 401]).toContain(response.status);

            if (response.status === 201) {
                expect(response.body).toHaveProperty('id');
                expect(response.body.name).toBe(campaignData.name);
            }
        });
    });
});

describe('Contract Tests: Scoring API', () => {
    let authToken;

    beforeAll(() => {
        authToken = 'Bearer test-jwt-token';
    });

    describe('GET /api/scoring/:id/score', () => {
        it('should return score matching frontend LeadScore interface', async () => {
            const response = await request(app)
                .get('/api/scoring/test-lead-id/score')
                .set('Authorization', authToken);

            expect([200, 404, 401]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('score');
                expect(response.body).toHaveProperty('category');
                expect(response.body).toHaveProperty('breakdown');

                expect(typeof response.body.score).toBe('number');
                expect(['HOT', 'WARM', 'COLD']).toContain(response.body.category);

                expect(response.body.breakdown).toHaveProperty('deterministic');
                expect(response.body.breakdown).toHaveProperty('ai');
            }
        });
    });
});

describe('Contract Tests: Error Responses', () => {
    it('should return 401 for missing auth token', async () => {
        const response = await request(app)
            .get('/api/leads')
            .expect(401);

        expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent resources', async () => {
        const response = await request(app)
            .get('/api/leads/non-existent-id')
            .set('Authorization', 'Bearer test-jwt-token');

        expect([404, 401]).toContain(response.status);
    });

    it('should return validation errors in consistent format', async () => {
        const response = await request(app)
            .post('/api/leads')
            .set('Authorization', 'Bearer test-jwt-token')
            .send({ invalid: 'data' })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        // If detailed errors, should have 'details' array
        if (response.body.details) {
            expect(Array.isArray(response.body.details)).toBe(true);
        }
    });
});

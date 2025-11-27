// Smoke Test Script (Staging)
// Runs basic health and webhook checks against the API
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'stub_api_key';

const runSmokeTests = async () => {
    console.log(`🚀 Starting Smoke Tests against ${BASE_URL}...\n`);
    let passed = 0;
    let failed = 0;

    // Helper to log result
    const logResult = (name, success, error = null) => {
        if (success) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${name}`);
            if (error) console.error(`   Error: ${error.message}`);
            if (error?.response) console.error(`   Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            failed++;
        }
    };

    try {
        // 1. Health Check
        try {
            const health = await axios.get(`${BASE_URL}/health`);
            logResult('Health Check', health.status === 200 && health.data.status === 'healthy');
        } catch (e) {
            logResult('Health Check', false, e);
        }

        // 2. Metrics Endpoint
        try {
            const metrics = await axios.get(`${BASE_URL}/metrics`);
            logResult('Metrics Endpoint', metrics.status === 200);
        } catch (e) {
            logResult('Metrics Endpoint', false, e);
        }

        // 3. Webhook: LeadOS (Lead Generation)
        try {
            const leadPayload = {
                user_id: '00000000-0000-0000-0000-000000000001'
            };
            const leadRes = await axios.post(`${BASE_URL}/api/webhooks/leados`, leadPayload, {
                headers: {
                    'X-API-Key': API_KEY,
                    'X-Request-Id': `smoke-test-${Date.now()}`
                }
            });
            logResult('LeadOS Webhook', leadRes.status === 200 && leadRes.data.workflow === 'lead_generation_api');
        } catch (e) {
            // 401/403 is expected if stub auth is strict, but we want to see if it reaches the endpoint
            logResult('LeadOS Webhook', false, e);
        }

        // 4. Webhook: WhatsApp (Primary)
        try {
            const waPayload = {
                object: 'whatsapp_business_account',
                entry: [{
                    id: '123456789',
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: { display_phone_number: '1234567890', phone_number_id: '123456789' },
                            contacts: [{ profile: { name: 'Smoke Test User' }, wa_id: '1234567890' }],
                            messages: [{
                                from: '1234567890',
                                id: 'wamid.test',
                                timestamp: Date.now(),
                                text: { body: 'Hello World' },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            };

            const waRes = await axios.post(`${BASE_URL}/api/webhooks/whatsapp/primary`, waPayload, {
                headers: {
                    'X-Hub-Signature-256': 'sha256=stub_signature', // Stub verification allows this
                    'X-Request-Id': `smoke-wa-${Date.now()}`
                }
            });
            logResult('WhatsApp Primary Webhook', waRes.status === 200);
        } catch (e) {
            logResult('WhatsApp Primary Webhook', false, e);
        }

    } catch (error) {
        console.error('Critical error running smoke tests:', error);
    }

    console.log(`\n----------------------------------------`);
    console.log(`Tests Completed: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`----------------------------------------\n`);

    if (failed > 0) process.exit(1);
};

runSmokeTests();

/**
 * Test script for Phase 1 P0 Critical APIs
 * Tests: CSV Import, Lead Assignment, Campaign Analytics, Admin Dashboard
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-test-token';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
    }
});

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (message) console.log(`   ${message}`);
    
    results.tests.push({ name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
}

async function testCSVImport() {
    console.log('\n📁 Testing CSV Import API...\n');

    try {
        // Create test CSV
        const csvContent = `name,phone_number,email,company
John Doe,+919876543210,john@example.com,Acme Corp
Jane Smith,+919876543211,jane@example.com,Tech Inc
Bob Johnson,+919876543212,bob@example.com,StartupXYZ`;

        fs.writeFileSync('/tmp/test-leads.csv', csvContent);

        // Test CSV upload
        const form = new FormData();
        form.append('file', fs.createReadStream('/tmp/test-leads.csv'));
        form.append('campaign_name', 'Test Campaign');

        const response = await api.post('/api/leads/import/csv', form, {
            headers: form.getHeaders()
        });

        logTest('CSV Import - Upload', response.data.success, 
            `Imported ${response.data.results.successful} leads`);

        // Test import history
        const historyResponse = await api.get('/api/leads/import/history');
        logTest('CSV Import - History', historyResponse.data.success,
            `Found ${historyResponse.data.history.length} imports`);

        // Cleanup
        fs.unlinkSync('/tmp/test-leads.csv');

    } catch (error) {
        logTest('CSV Import', false, error.response?.data?.error || error.message);
    }
}

async function testLeadAssignment() {
    console.log('\n👥 Testing Lead Assignment API...\n');

    try {
        // Test assign leads (mock data)
        const assignResponse = await api.post('/api/leads/import/assign', {
            leadIds: ['test-lead-id-1', 'test-lead-id-2'],
            sdrId: 'test-sdr-id',
            reason: 'Test assignment'
        });

        logTest('Lead Assignment - Assign', assignResponse.data.success,
            `Assigned ${assignResponse.data.results.successful.length} leads`);

    } catch (error) {
        logTest('Lead Assignment - Assign', false, 
            error.response?.data?.error || error.message);
    }

    try {
        // Test SDR workload
        const workloadResponse = await api.get('/api/leads/sdr/test-sdr-id/workload');
        logTest('Lead Assignment - Workload', workloadResponse.data.success,
            `Workload: ${workloadResponse.data.workload.total_leads} leads`);

    } catch (error) {
        logTest('Lead Assignment - Workload', false,
            error.response?.data?.error || error.message);
    }
}

async function testCampaignAnalytics() {
    console.log('\n📊 Testing Campaign Analytics API...\n');

    try {
        // Test campaign analytics
        const analyticsResponse = await api.get('/api/analytics/campaigns', {
            params: {
                from: '2025-11-01',
                to: '2025-11-30'
            }
        });

        logTest('Campaign Analytics - Overview', analyticsResponse.data.success,
            `Total leads: ${analyticsResponse.data.analytics.overview.total_leads}`);

    } catch (error) {
        logTest('Campaign Analytics - Overview', false,
            error.response?.data?.error || error.message);
    }

    try {
        // Test SDR performance
        const sdrResponse = await api.get('/api/analytics/sdr-performance');
        logTest('Campaign Analytics - SDR Performance', sdrResponse.data.success,
            `Found ${sdrResponse.data.performance.length} SDRs`);

    } catch (error) {
        logTest('Campaign Analytics - SDR Performance', false,
            error.response?.data?.error || error.message);
    }

    try {
        // Test funnel
        const funnelResponse = await api.get('/api/analytics/funnel');
        logTest('Campaign Analytics - Funnel', funnelResponse.data.success,
            `Funnel stages: ${funnelResponse.data.funnel.stages.length}`);

    } catch (error) {
        logTest('Campaign Analytics - Funnel', false,
            error.response?.data?.error || error.message);
    }

    try {
        // Test timeline
        const timelineResponse = await api.get('/api/analytics/timeline');
        logTest('Campaign Analytics - Timeline', timelineResponse.data.success,
            `Timeline data points: ${timelineResponse.data.timeline.length}`);

    } catch (error) {
        logTest('Campaign Analytics - Timeline', false,
            error.response?.data?.error || error.message);
    }
}

async function testAdminDashboard() {
    console.log('\n🔐 Testing Admin Dashboard API...\n');

    try {
        // Test admin overview
        const overviewResponse = await api.get('/api/admin/overview');
        logTest('Admin Dashboard - Overview', overviewResponse.data.success,
            `Active tenants: ${overviewResponse.data.overview.system.active_tenants}`);

    } catch (error) {
        logTest('Admin Dashboard - Overview', false,
            error.response?.data?.error || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Phase 1 API Tests...');
    console.log(`API Base: ${API_BASE}`);
    console.log('=' .repeat(60));

    await testCSVImport();
    await testLeadAssignment();
    await testCampaignAnalytics();
    await testAdminDashboard();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:');
    console.log(`   Total Tests: ${results.passed + results.failed}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => !t.passed).forEach(t => {
            console.log(`   - ${t.name}: ${t.message}`);
        });
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});

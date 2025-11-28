import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const latencyP99 = new Trend('latency_p99');
const throughput = new Counter('requests_total');

const BASE_URL = __ENV.TARGET_URL || 'http://spike-absorber.production.svc.cluster.local';

export const options = {
    scenarios: {
        // Scenario 1: Sustained 6000 req/sec for 10 minutes
        sustained_load: {
            executor: 'constant-arrival-rate',
            rate: 6000,
            timeUnit: '1s',
            duration: '10m',
            preAllocated

VUs: 1000,
            maxVUs: 2000,
        },

        // Scenario 2: Spike to 60,000 req/sec for 30 seconds
        spike_test: {
            executor: 'constant-arrival-rate',
            rate: 60000,
            timeUnit: '1s',
            duration: '30s',
            preAllocatedVUs: 5000,
            maxVUs: 10000,
            startTime: '11m', // Start after sustained load
        },

        // Scenario 3: Lead burst - 600 leads/min
        lead_burst: {
            executor: 'constant-arrival-rate',
            rate: 10, // 600/60 = 10 per second
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 100,
            maxVUs: 200,
            startTime: '12m',
        },
    },

    thresholds: {
        'http_req_duration{scenario:sustained_load}': ['p(99)<500'], // 99th percentile under 500ms
        'http_req_failed{scenario:sustained_load}': ['rate<0.01'], // Error rate < 1%
        'http_req_duration{scenario:spike_test}': ['p(99)<1000'], // Allow higher latency during spike
        'http_req_failed{scenario:spike_test}': ['rate<0.05'], // Error rate < 5% during spike
    },
};

// Generate mock lead data
function generateLead() {
    return {
        user_id: `user_${Math.floor(Math.random() * 10000)}`,
        name: `Lead ${Math.floor(Math.random() * 100000)}`,
        phone_number: `+1${Math.floor(Math.random() * 10000000000)}`,
        campaign_id: `camp_${Math.floor(Math.random() * 100)}`,
    };
}

export default function () {
    const scenario = __ITER % 3 === 0 ? 'webhook' : 'lead';

    if (scenario === 'webhook') {
        // Test spike absorber webhook endpoint
        const payload = JSON.stringify(generateLead());
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-load-test-token',
                'X-Idempotency-Key': `load-test-${__VU}-${__ITER}`,
            },
            timeout: '10s',
        };

        const res = http.post(`${BASE_URL}/api/webhooks/leados`, payload, params);

        // Validate response
        const success = check(res, {
            'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
            'response time < 500ms': (r) => r.timings.duration < 500,
            'has trace ID': (r) => r.headers['X-Trace-Id'] !== undefined,
        });

        errorRate.add(!success);
        latencyP99.add(res.timings.duration);
        throughput.add(1);

        // Handle backpressure
        if (res.status === 429) {
            const retryAfter = parseInt(res.headers['Retry-After'] || '1');
            sleep(retryAfter);
        }
    } else {
        // Test direct lead ingestion
        const lead = generateLead();
        const res = http.post(`${BASE_URL}/api/leads`, JSON.stringify(lead), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-load-test-token',
            },
        });

        check(res, {
            'lead created': (r) => r.status === 201 || r.status === 202,
        });
    }

    // Small delay to avoid overwhelming the VU
    sleep(0.01);
}

export function handleSummary(data) {
    return {
        'artifacts/perf/tests/k6/results.json': JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

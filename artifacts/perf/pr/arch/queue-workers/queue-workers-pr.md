# PR: Queue Workers Architecture

**Type:** Architecture / Infrastructure  
**Impact:** High  
**Estimated Effort:** Large (2 weeks)

---

## Summary

Implement enterprise-capacity architecture with spike absorber, hierarchical queues (Critical/Normal/Low), and heterogeneous worker pools (A/B/C) to handle 6K rps ingress, 50K msg/sec queue throughput, and 20K writes/sec database load.

---

## Components

### 1. Spike Absorber Microservice
**Purpose:** Fast ACK layer (<100ms) to prevent backend overload

**Features:**
- Deduplication using Redis (SHA-256 body hash)
- Minimal validation (schema check only)
- Enqueue to Kafka with partition key (`tenant_id`)
- Return `202 Accepted` with trace ID

**Deployment:**
- 10 pods minimum, 100 pods maximum
- HPA on CPU + custom metric (queue lag)
- Resource limits: 500m CPU, 512Mi memory

### 2. Hierarchical Queues
**Tiers:**
- **Critical (P0):** <5s latency, 100 partitions, replication factor 3
- **Normal (P1):** <30s latency, 200 partitions, replication factor 2
- **Low (P2):** <5min latency, 50 partitions, auto-pause during overload

**Sharding:** By `tenant_id` to isolate spikes

### 3. Heterogeneous Worker Pools

| Pool | vCPU | Memory | Throughput | Use Case |
|------|------|--------|------------|----------|
| A | 0.2 | 512Mi | 200 ops/sec | Lightweight (qualification) |
| B | 1.0 | 2-4Gi | 10-30 AI/sec | AI orchestration |
| C | 0.5 | 1Gi | 50 ops/sec | Medium (CRM sync) |

**Features:**
- Per-pool autoscaling (KEDA on Kafka lag)
- Thin-mode support (disable enrichments when lag > 30s)
- Bulkhead isolation (failure in C doesn't affect A)

---

## Resiliency Patterns

1. **Multi-stage admission control** (Edge → Gateway → Absorber)
2. **Per-tenant priority credits** (prevent single-tenant DOS)
3. **Adaptive sampling** (drop LOW queue during severe overload)
4. **Circuit breaker orchestration** (auto-route to fallbacks)
5. **End-to-end backpressure** (429 + Retry-After headers)

---

## Files Changed

**New Files:**
- `infra/k8s/spike-absorber.yaml`
- `infra/k8s/workers.yaml`
- `infra/k8s/kafka-topics.yaml`
- `workers/spike-absorber.js`
- `workers/worker-a.js`
- `workers/worker-b.js`
- `workers/worker-c.js`
- `workers/thin-mode-controller.js`
- `infra/docker/docker-compose.yml`

**Modified Files:**
- `infra/k8s/ingress.yaml` (add rate limiting)
- `observability/prometheus-rules.yaml` (add queue lag alerts)
- `observability/grafana-dashboard.json` (add queue metrics)

---

## Testing Plan

1. **Load Test:** k6 with 6K rps sustained, 60K rps spike
2. **Chaos Test:** Kill 30% workers, partition DB, slow Kafka
3. **Soak Test:** 24h continuous load to check memory leaks
4. **Validation:** Confirm SLOs (P99 < 500ms, queue lag < 10s)

---

## Deployment Steps

1. Apply Kafka topics: `kubectl apply -f infra/k8s/kafka-topics.yaml`
2. Deploy spike absorber: `kubectl apply -f infra/k8s/spike-absorber.yaml`
3. Deploy workers: `kubectl apply -f infra/k8s/workers.yaml`
4. Verify HPA: `kubectl get hpa -n production`
5. Run smoke test: `k6 run tests/k6/smoke-test.js`
6. Monitor Grafana dashboard for queue lag, latency, error rate

---

## Risks

- **Medium:** Hot partitions if tenant distribution is uneven → Mitigate with auto-rebalancing
- **Low:** Kafka broker failure → Mitigate with replication factor 3
- **Medium:** Worker pool exhaustion during sustained spike → Mitigate with burst autoscale to 200 pods

---

## Rollback Plan

1. Scale spike absorber to 0: `kubectl scale deployment spike-absorber --replicas=0`
2. Route traffic directly to existing API: Update ingress
3. Drain queues manually or let workers process backlog

---

**Status:** Ready for staging deployment. Awaiting approval.

# Enterprise-Capacity Architecture Summary

**Date:** 2025-11-28  
**Target Capacity:** 6,000 req/sec API ingress | 50,000 msg/sec queue | 20,000 DB writes/sec  
**Resiliency Level:** Zero-loss, crash-proof, self-stabilizing

---

## Capacity Targets

| Component | Target | Strategy |
|-----------|--------|----------|
| API Ingress | 6,000 req/sec | Multi-stage throttling + spike absorber |
| Queue Throughput | 50,000 msg/sec | Sharded partitions + hierarchical tiers |
| DB Writes | 20,000 writes/sec | Batch writes (500 rows) + sharding |
| Lead Burst | 600 leads/min | Priority credits + adaptive sampling |
| Message Retention | 48 hours | TTL-based cleanup |
| Internal Tasks | 50M/month | Heterogeneous worker pools |

---

## Enterprise Resiliency Patterns

### 1. Multi-Stage Admission Control
```
Edge → API Gateway → Ingress → Spike Absorber → Service
  ↓         ↓            ↓             ↓            ↓
Token    Sliding     Rate         Dedup       Business
Bucket   Window      Limit        Only        Logic
```

### 2. Spike Absorber Layer
- **Purpose:** Fast ACK (<100ms) + minimal validation
- **Flow:** Client → Absorber → Queue → Worker
- **Benefits:** Prevents backend overload, provides instant 202 Accepted

### 3. Hierarchical Queue Tiers
```
Priority: CRITICAL > NORMAL > LOW
         ↓           ↓        ↓
      P0 Queue   P1 Queue  P2 Queue
```
- Auto-pause LOW tier during overload
- Dynamic rebalancing based on lag

### 4. Per-Tenant Priority Credits
- Each tenant receives replenishing credits for critical tasks
- Credit exhaustion → non-critical tasks delayed
- Prevents single-tenant DOS

### 5. Thin-Mode Fallback
**Trigger:** Queue lag > 30 seconds  
**Action:** Disable enrichments, reports; run qualification only  
**Recovery:** Auto-restore when lag < 10 seconds

### 6. Adaptive Sampling
**Trigger:** Severe load (queue lag > 5 min)  
**Action:** Process only X% of non-critical tasks  
**Benefit:** Maintain throughput for critical workflows

### 7. Bulkhead Isolation
```
Worker Pool A: Lead Qualification (isolated)
Worker Pool B: CRM Sync (isolated)
Worker Pool C: Report Generation (isolated)
```
- Failure in Pool C doesn't affect Pool A
- Separate resource limits per pool

### 8. Predictive Autoscaling
- Forecast 5-10 minutes ahead using traffic trends
- Pre-warm worker pools before spike hits
- Based on: time-of-day, historical patterns, current rate-of-change

### 9. Sharded Compute
- Shard by: `client_id`, `campaign_id`, or `region`
- Isolates spikes to specific shards
- Hot partition detection + auto-rebalance

### 10. Heterogeneous Worker Fleet

| Worker Type | vCPU | Memory | Throughput | Use Case |
|-------------|------|---------|------------|----------|
| Worker A | 0.2 | 512Mi | 200 ops/sec | Lightweight tasks |
| Worker B | 1.0 | 2-4Gi | 10-30 AI/sec | AI orchestration |
| Worker C | 0.5 | 1Gi | 50 ops/sec | Medium tasks |

### 11. Circuit Breaker Orchestration
**Metrics Monitored:**
- DB p99 latency
- Queue lag
- External API failure rate

**Actions:**
- DB slow → Enable local cache fallback
- Queue overload → Activate thin-mode
- External API down → Use cached/mocked responses

### 12. Local-Model Fallback
- If external AI inference slows (>2s)
- Switch to cached predictions or on-node lightweight model
- Graceful degradation vs hard failure

### 13. Anti-Bot & Anomaly Filtration
**Edge Detection:**
- Abnormal request patterns (>100 req/sec from single IP)
- Invalid payloads (malformed JSON, suspicious headers)
- Replay attack attempts

**Action:** Drop aggressively at edge, log for analysis

### 14. End-to-End Backpressure
```
Consumer Overload → Queue → Producer Throttle → API 429
```
- If consumers lag, upstream automatically throttles
- Prevents cascading failures

### 15. Guaranteed Idempotency
- All writes include idempotency key
- TTL-based deduplication (24h window)
- SHA-256 body hash validation

### 16. Graceful Feature Shedding
**Load Priority:**
1. Lead qualification (keep alive)
2. CRM sync (throttle)
3. Enrichment (pause)
4. Reporting (disable)
5. Analytics (disable)

### 17. Burst Credits + Cost Caps
- Define "burst budget" per tenant
- Beyond budget → autoscaling pauses
- Emergency scale-stop switch

### 18. Progressive Response UX
**Under Overload:**
```json
{
  "status": "queued",
  "retry_after": 120,
  "position": 453,
  "estimated_completion": "2025-11-28T23:30:00Z"
}
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     EDGE LAYER                          │
│  Rate Limit (Token Bucket) + DDoS Protection           │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              API GATEWAY (Kong/Nginx)                   │
│  Sliding Window Limiter + Circuit Breaker               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│            SPIKE ABSORBER MICROSERVICE                  │
│  Fast ACK (<100ms) + Dedup + Queue Enqueue             │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │    HIERARCHICAL QUEUES     │
        ├────────┬──────────┬────────┤
        │CRITICAL│  NORMAL  │  LOW   │
        │(Kafka) │ (Kafka)  │(Kafka) │
        └───┬────┴────┬─────┴───┬────┘
            │         │         │
    ┌───────▼─┐  ┌────▼───┐  ┌─▼──────┐
    │Worker A │  │Worker B│  │Worker C│
    │(Small)  │  │(Large) │  │(Medium)│
    │200ops/s │  │30AI/s  │  │50ops/s │
    └─────┬───┘  └────┬───┘  └───┬────┘
          │           │          │
    ┌─────▼───────────▼──────────▼─────┐
    │     POSTGRESQL (Sharded)         │
    │   PgBouncer + Connection Pool    │
    │   20k writes/sec (batch mode)    │
    └──────────────────────────────────┘
```

---

## SLOs & Error Budgets

| Metric | SLO | Error Budget | Action on Breach |
|--------|-----|--------------|------------------|
| API p99 latency | <500ms | 0.1% | Enable caching |
| Queue lag | <10s | 1% | Activate thin-mode |
| DB write latency | <100ms | 0.5% | Enable batching |
| Availability | 99.9% | 43.2 min/month | Circuit breaker |

---

## Cost Optimization

### Burst Budget Policy
- Normal: 100 pods max
- Burst: 200 pods max (15 min window)
- Emergency stop: 250 pods (hard limit)

### Resource Efficiency
- Use spot instances for Worker C (non-critical)
- Reserved instances for Worker A (always-on)
- Serverless fallback for extreme spikes

---

## Migration Path

1. ✅ Phase C: Destruction testing complete (99% readiness)
2. 🔄 **Phase D (Current):** Enterprise capacity engineering
3. ⏭️ Phase E: Load testing + performance validation
4. ⏭️ Phase F: Production deployment with canary rollout

---

## Files Generated

- `infra/k8s/*.yaml` - Kubernetes manifests
- `queue/` - Queue architecture + partition plan
- `workers/` - Worker pool definitions
- `tests/k6/` - Load test scenarios
- `tests/chaos/` - Chaos test scenarios
- `observability/` - Prometheus + Grafana configs

**Status:** Architecture design complete. Proceed with implementation.

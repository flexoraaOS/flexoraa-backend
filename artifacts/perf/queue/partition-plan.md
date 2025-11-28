# Queue Architecture & Partition Plan

**Target:** 50,000 msg/sec throughput  
**Platform:** Apache Kafka (recommended) or Amazon SQS FIFO

---

## Hierarchical Queue Tiers

### 1. Critical Queue (P0)
- **Purpose:** Time-sensitive, revenue-impacting events
- **Examples:** Lead assignments, payment webhooks, SLA-bound CRM syncs
- **SLO:** <5s processing latency
- **Partitions:** 100
- **Consumer Groups:** 5-10
- **Replication Factor:** 3
- **Retention:** 24 hours

### 2. Normal Queue (P1)
- **Purpose:** Standard business workflows
- **Examples:** Lead enrichment, report generation, scheduled notifications
- **SLO:** <30s processing latency
- **Partitions:** 200
- **Consumer Groups:** 10-20
- **Replication Factor:** 2
- **Retention:** 48 hours

### 3. Low Queue (P2)
- **Purpose:** Non-critical, deferrable tasks
- **Examples:** Analytics, bulk exports, cleanup jobs
- **SLO:** <5min processing latency
- **Partitions:** 50
- **Consumer Groups:** 5
- **Replication Factor:** 2
- **Retention:** 48 hours
- **Auto-Pause:** When P0 or P1 lag > 30s

---

## Partition Strategy

### Sharding Key Selection
Primary: `tenant_id`  
Secondary: `campaign_id`  
Fallback: `timestamp` (round-robin)

**Benefits:**
- Isolates tenant spikes
- Prevents hot partitions
- Enables per-tenant quotas

### Partition Count Calculation
```
Total Partitions = (Target Throughput / Per-Consumer Throughput) × Overhead Factor
                 = (50,000 msg/sec / 250 msg/sec/consumer) × 1.5
                 = 300 partitions (distributed across tiers)
```

---

## Consumer Group Distribution

| Worker Pool | Critical | Normal | Low | Total Consumers |
|-------------|----------|--------|-----|-----------------|
| Worker A    | 50       | 100    | 25  | 175             |
| Worker B    | 30       | 50     | 0   | 80              |
| Worker C    | 20       | 50     | 25  | 95              |
| **Total**   | **100**  | **200**| **50**| **350**       |

---

## Auto-Scaling Logic

### Scale-Up Triggers
```yaml
- consumer_lag > 1000 messages (P0)
- consumer_lag > 5000 messages (P1)
- p99_processing_time > 2 × SLO
- oldest_unprocessed_message > 30s
```

### Scale-Down Triggers
```yaml
- consumer_lag < 100 messages (sustained for 5 min)
- cpu_utilization < 30% (sustained for 10 min)
- oldest_unprocessed_message < 5s
```

### KEDA Scal

edObject Example
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-a-critical-scaler
spec:
  scaleTargetRef:
    name: worker-a-lightweight
  minReplicaCount: 50
  maxReplicaCount: 200
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka-brokers:9092
      consumerGroup: worker-a-critical
      topic: leads-critical
      lagThreshold: '500'
```

---

## Overload Behavior

### Thin-Mode Activation
**Trigger:** Normal queue lag > 30 seconds  
**Actions:**
1. Pause LOW queue consumption
2. Disable enrichments in Worker A
3. Disable report generation in Worker C
4. Log degradation event to Prometheus

### Emergency Shedding
**Trigger:** Critical queue lag > 60 seconds  
**Actions:**
1. Drop 50% of LOW queue messages
2. Sample 50% of NORMAL queue (non-revenue tasks)
3. Alert on-call engineer
4. Activate burst autoscale (up to max replicas)

---

## Idempotency & Deduplication

### Strategy
- Store message hash in Redis with 24h TTL
- Use `X-Idempotency-Key` header or generate from payload hash
- Reject duplicates with `409 Conflict` before enqueueing

### Redis Key Format
```
idempotency:{queue_tier}:{tenant_id}:{message_hash}
```

---

## Message Retention

| Tier | Retention | Cleanup Strategy |
|------|-----------|------------------|
| Critical | 24h | Auto-delete after processing + 1h buffer |
| Normal | 48h | Auto-delete after processing + 6h buffer |
| Low | 48h | Auto-delete after processing + 12h buffer |

---

## Partition Rebalancing

**Trigger:** Hot partition detected (throughput > 2× average)  
**Actions:**
1. Identify top 10 keys causing imbalance
2. Re-hash those keys to underutilized partitions
3. Gradually migrate consumers
4. Monitor for 15 min before declaring stable

---

## Cost Optimization

- Use **compacted topics** for idempotency keys (reduce storage)
- Use **tiered storage** (S3) for messages older than 6 hours
- **Auto-pause** LOW queue during off-peak hours (midnight-6am)

---

## Monitoring Metrics

```prometheus
# Lag per consumer group
kafka_consumer_lag{group="worker-a-critical",topic="leads-critical"}

# Messages per second
kafka_topic_partition_current_offset_rate{topic="leads-critical"}

# Oldest unprocessed message age
kafka_consumer_group_lag_seconds{group="worker-a-critical"}
```

---

**Status:** Queue architecture complete. Proceed with K8s deployment.

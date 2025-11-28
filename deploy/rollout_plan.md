# Canary Deployment Rollout Plan

**Project:** Flexoraa Production Backend  
**Strategy:** Progressive Traffic Shifting with Auto-Rollback  
**Total Duration:** 48 hours minimum

---

## Deployment Stages

### Stage 1: Canary (10% Traffic) - 24 Hours

**Target:** Route 10% of production traffic to new version

**Health Checks:**
- ✅ p95 latency < 2000ms
- ✅ Error rate < 5%
- ✅ WhatsApp delivery success > 98%
- ✅ AI token error rate < 2%
- ✅ Database connection pool < 80%

**Rollback Triggers:**
- p95 latency > 3000ms for 10 minutes → AUTO ROLLBACK
- Error rate > 10% for 5 minutes → AUTO ROLLBACK
- WhatsApp failure rate > 5% for 10 minutes → AUTO ROLLBACK
- Manual rollback command → IMMEDIATE ROLLBACK

**Actions:**
```bash
# Deploy canary
kubectl set image deployment/api-deployment api=<IMAGE>:new --record
kubectl scale deployment/api-deployment-canary --replicas=1

# Monitor
kubectl logs -f deployment/api-deployment-canary
watch -n 30 'curl -s https://api.flexoraa.com/health | jq'

# Rollback if needed
kubectl rollout undo deployment/api-deployment
```

---

### Stage 2: Beta (50% Traffic) - 24 Hours

**Prerequisites:**
- ✅ Canary stage completed 24 hours with no critical alerts
- ✅ Manual approval from engineering lead

**Target:** Route 50% of traffic to new version

**Health Checks:** (Same as Stage 1)

**Additional Monitoring:**
- Database query performance (check slow query log)
- Redis hit rate (should be > 90%)
- AI token spend (should not increase >20% from baseline)

**Rollback Triggers:** (Same as Stage 1)

---

### Stage 3: Full Rollout (100% Traffic)

**Prerequisites:**
- ✅ Beta stage completed 24 hours with no critical alerts
- ✅ Manual approval from CTO

**Actions:**
```bash
# Full rollout
kubectl set image deployment/api-deployment api=<IMAGE>:new --record
kubectl rollout status deployment/api-deployment

# Verify
kubectl get pods
curl https://api.flexoraa.com/health
```

**Post-Deployment:**
- Monitor for 4 hours continuously
- Review Grafana dashboards
- Check Slack for alert notifications
- Update deployment log

---

## Automated Rollback Logic

### Trigger Conditions

```yaml
rollback_conditions:
  - name: high_latency
    metric: p95_latency_seconds
    threshold: 3
    duration: 10m
    action: rollback
    
  - name: high_error_rate
    metric: error_rate_percent
    threshold: 10
    duration: 5m
    action: rollback
    
  - name: whatsapp_failures
    metric: whatsapp_failure_rate_percent
    threshold: 5
    duration: 10m
    action: rollback
```

### Rollback Procedure

**Automated:**
```bash
#!/bin/bash
# auto-rollback.sh

echo "⚠️ ROLLBACK TRIGGERED"
kubectl rollout undo deployment/api-deployment
kubectl rollout status deployment/api-deployment

# Notify team
curl -X POST $SLACK_WEBHOOK -d '{
  "text": "🚨 AUTO-ROLLBACK: Deployment rolled back due to health check failure"
}'

# Log incident
echo "$(date): Auto-rollback executed" >> /var/log/deployments/rollback.log
```

**Manual:**
```bash
# Immediate rollback
kubectl rollout undo deployment/api-deployment

# Rollback to specific version
kubectl rollout undo deployment/api-deployment --to-revision=42

# Verify
kubectl rollout status deployment/api-deployment
kubectl describe deployment api-deployment
```

---

## Health Check Endpoints

### Primary Health Check
```
GET /health
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-28T08:00:00Z",
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "ai_service": "available"
  }
}
```

### Readiness Probe
```
GET /ready
```

**Expected Response (200 OK):**
```json
{
  "ready": true,
  "checks": {
    "database_pool": "ok",
    "redis_connection": "ok",
    "disk_space": "ok"
  }
}
```

---

## Monitoring During Deployment

### Grafana Dashboards to Watch
1. **API Latency** - p50/p95/p99 trends
2. **Error Rate** - By endpoint
3. **Workflow Success Rate** - Per workflow type
4. **Database Metrics** - Connection pool, query time
5. **AI Token Usage** - Spend rate

### Slack Alerts
Configure webhook: `$SLACK_WEBHOOK_URL`

**Alert Routing:**
- CRITICAL → `#prod-alerts` + PagerDuty
- WARNING → `#engineering`
- INFO → `#deployments`

---

## Pre-Deployment Checklist

- [ ] All tests passing in CI (`test.yml`)
- [ ] Contract tests verified (`test:contracts`)
- [ ] Security scans clean (no secrets, no vulnerabilities)
- [ ] Database migrations dry-run successful
- [ ] Staging environment validated
- [ ] Rollback procedure tested
- [ ] Team notified in `#deployments` channel
- [ ] Backup of current production state

---

## Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Grafana dashboards reviewed (no anomalies)
- [ ] Error logs checked (no new critical errors)
- [ ] User-facing features tested (smoke test)
- [ ] AI services functioning (test lead scoring)
- [ ] WhatsApp templates sending successfully
- [ ] Database migrations applied successfully
- [ ] Deployment tagged in GitHub
- [ ] Post-mortem scheduled (if issues occurred)

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| **On-Call Engineer** | +91-XXX-XXX-XXXX | 24/7 |
| **Engineering Lead** | engineering@flexoraa.com | Business hours |
| **CTO** | cto@flexoraa.com | Escalation only |
| **DevOps** | devops@flexoraa.com | 24/7 |

---

## Deployment Log Template

```markdown
# Deployment: [VERSION] - [DATE]

**Deployed By:** [NAME]  
**Deploy Time:** [TIMESTAMP]  
**Stage:** Canary / Beta / Full  

**Health Checks:**
- p95 Latency: [VALUE]ms
- Error Rate: [VALUE]%
- WhatsApp Success: [VALUE]%

**Issues:** None / [DESCRIPTION]

**Rollback:** No / Yes - [REASON]

**Notes:** [ANY OBSERVATIONS]
```

---

**Last Updated:** 2025-11-28  
**Owner:** DevOps Team

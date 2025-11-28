# Operational Runbook

**Project:** Flexoraa Production Backend  
**Version:** 1.0  
**Last Updated:** 2025-11-28

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Daily Operations](#daily-operations)
3. [Incident Response](#incident-response)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Monitoring & Alerts](#monitoring--alerts)

---

## Quick Reference

### Critical Contacts

| Role | Contact | Escalation Path |
|------|---------|-----------------|
| **On-Call Engineer** | +91-XXX-XXX-XXXX | → Lead → CTO |
| **Database Admin** | dba@flexoraa.com | → Infra Team |
| **Security Team** | security@flexoraa.com | → CISO |

### Emergency Procedures

```bash
# Immediate rollback

 (if bad deployment)
kubectl rollout undo deployment/api-deployment

# Scale down (if under attack)
kubectl scale deployment/api-deployment --replicas=1

# Enable maintenance mode
kubectl patch deployment/api-deployment -p '{"spec":{"replicas":0}}'
```

### Health Check URLs

- **API Health:** `https://api.flexoraa.com/health`
- **Grafana:** `https://grafana.flexoraa.com`
- **Prometheus:** `https://prometheus.flexoraa.com`

---

## Daily Operations

### Morning Checklist

- [ ] Check Grafana dashboard for overnight anomalies
- [ ] Review error rate (should be <1%)
- [ ] Check AI token usage (budget: ~3K tokens/day)
- [ ] Verify backup completion (last 24h)
- [ ] Review Slack alerts (if any)

### Commands

```bash
# Check API health
curl https://api.flexoraa.com/health

# View recent logs (last 1 hour)
kubectl logs deployment/api-deployment --since=1h --tail=100

# Check pod status
kubectl get pods -l app=api

# Check resource usage
kubectl top pods
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0** | Complete outage | 15 minutes | API down, database unreachable |
| **P1** | Critical degradation | 1 hour | Error rate >10%, extreme latency |
| **P2** | Partial degradation | 4 hours | Single feature broken, slow performance |
| **P3** | Minor issue | 1 business day | Cosmetic bug, non-critical warning |

### P0: Complete Outage

**Symptoms:** API returning 502/503, health check failing

**Immediate Actions:**
1. Page on-call engineer
2. Check EKS cluster status: `kubectl cluster-info`
3. Check pod status: `kubectl get pods`
4. Check RDS connectivity: `aws rds describe-db-instances`

**Common Causes:**
- Pod crashes → Check logs: `kubectl logs deployment/api-deployment`
- Database connection pool exhausted → Restart pods: `kubectl rollout restart deployment/api-deployment`
- RDS maintenance window → Check AWS console

**Resolution:**
```bash
# If pods are crash looping
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous

# If database is down
aws rds reboot-db-instance --db-instance-identifier flexoraa-production-db

# If Redis is down
aws elasticache reboot-cache-cluster --cache-cluster-id flexoraa-production-redis
```

### P1: Critical Degradation

**Symptoms:** Error rate >10%, API latency >5s

**Actions:**
1. Check Grafana dashboard for spike source
2. Review recent deployments: `kubectl rollout history deployment/api-deployment`
3. Check external service status (Gemini API, WhatsApp, Twilio)

**Resolution:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/api-deployment

# Scale up to handle load
kubectl scale deployment/api-deployment --replicas=5

# Check which endpoint is slow
kubectl logs deployment/api-deployment | grep "duration_ms"
```

---

## Common Issues & Solutions

### Issue: High Memory Usage

**Symptoms:** Pods being OOMKilled, frequent restarts

**Diagnosis:**
```bash
kubectl top pods
kubectl describe pod <pod-name> | grep -A 5 "Limits"
```

**Solution:**
```bash
# Increase memory limits
kubectl set resources deployment/api-deployment --limits=memory=2Gi

# Or update deployment YAML and restart
kubectl apply -f k8s/deployment.yaml
```

### Issue: Database Connection Pool Exhausted

**Symptoms:** Errors: "too many clients already"

**Diagnosis:**
```bash
# Check active connections
kubectl exec -it deployment/api-deployment -- node -e "
const db = require('./src/config/database');
db.query('SELECT count(*) FROM pg_stat_activity', console.log);
"
```

**Solution:**
- Increase RDS `max_connections` parameter
- Reduce pool size in `api/src/config/database.js`
- Add connection pooler (PgBouncer)

### Issue: Redis Connection Failures

**Symptoms:** Rate limiting not working, sessions lost

**Diagnosis:**
```bash
# Test Redis connectivity
kubectl exec -it deployment/api-deployment -- node -e "
const redis = require('./src/middleware/rateLimiter').redis;
redis.ping().then(console.log);
"
```

**Solution:**
```bash
# Check Redis cluster status
aws elasticache describe-cache-clusters --cache-cluster-id flexoraa-production-redis

# Reboot if necessary
aws elasticache reboot-cache-cluster --cache-cluster-id flexoraa-production-redis --cache-node-ids-to-reboot 0001
```

### Issue: WhatsApp Messages Not Sending

**Symptoms:** 400/401 errors from Graph API

**Diagnosis:**
- Check access token expiry
- Verify phone number ID: `755917534271095`
- Check Meta Business Suite for restrictions

**Solution:**
```bash
# Test WhatsApp API directly
curl -X POST "https://graph.facebook.com/v17.0/755917534271095/messages" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"919876543210","type":"text","text":{"body":"Test"}}'
```

---

## Maintenance Procedures

### Database Migration

```bash
# 1. Backup database first
aws rds create-db-snapshot \
  --db-instance-identifier flexoraa-production-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d-%H%M%S)

# 2. Apply migration
kubectl exec -it deployment/api-deployment -- npm run migrate

# 3. Verify
kubectl exec -it deployment/api-deployment -- psql $DATABASE_URL -c "\\dt"
```

### Scaling Up/Down

```bash
# Scale API pods
kubectl scale deployment/api-deployment --replicas=5

# Scale RDS (requires downtime!)
aws rds modify-db-instance \
  --db-instance-identifier flexoraa-production-db \
  --db-instance-class db.r5.large \
  --apply-immediately
```

### Secrets Rotation

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Update Secrets Manager
aws secretsmanager update-secret \
  --secret-id /flexoraa/production/jwt-secret \
  --secret-string "$NEW_SECRET"

# 3. Restart pods to pick up new secret
kubectl rollout restart deployment/api-deployment
```

---

## Monitoring & Alerts

### Alert: Error Rate >5%

**Action:** Check Grafana → Error Rate panel

**Common Causes:**
- External API failures (Gemini, WhatsApp)
- Database timeouts
- Invalid webhook payloads

**Resolution:**
- Enable circuit breakers
- Increase timeout values
- Add retry logic

### Alert: API Latency p99 >2s

**Action:** Check Grafana → API Latency panel

**Diagnosis:**
```bash
# Find slow queries
kubectl logs deployment/api-deployment | grep "slow query"

# Check database load
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=flexoraa-production-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Resolution:**
- Add database indexes
- Optimize slow queries
- Scale up RDS instance

### Alert: Opt-Out Spike (>10 per 5 min)

**Action:** Investigate message content/source

**Diagnosis:**
- Check recent WhatsApp templates sent
- Review consent_log for patterns
- Identify campaign causing complaints

**Resolution:**
- Pause affected campaign immediately
- Review message content for compliance
- Implement template approval process

---

## Useful Commands Cheat Sheet

```bash
# View all deployments
kubectl get deployments

# Get pod logs
kubectl logs <pod-name> --follow

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/bash

# Port forward for local debugging
kubectl port-forward deployment/api-deployment 4000:4000

# Check ConfigMaps
kubectl get configmaps

# Check Secrets
kubectl get secrets

# View events
kubectl get events --sort-by='.lastTimestamp'

# Database connection
kubectl exec -it deployment/api-deployment -- psql $DATABASE_URL
```

---

**Document Ownership:** DevOps Team  
**Review Schedule:** Monthly  
**Last Reviewed:** 2025-11-28


# Hetzner Production Deployment Guide

**Target:** Hetzner CX22 VM  
**Stack:** Docker + Node.js + Supabase + Redis  
**Capacity:** Up to 1,000 req/sec sustained

---

## Server Specifications

**Hetzner CX22:**
- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- 20 TB traffic

**Additional Resources:**
- Hetzner Block Storage (100 GB) - `/mnt/HC_Volume_1`
- Hetzner Object Storage - Backups
- Supabase (free tier: 500 MB database, 2 GB bandwidth/day)

---

## Pre-Deployment Checklist

### 1. Provision Hetzner VM
```bash
# Create CX22 server via Hetzner Cloud Console
# Location: Nuremberg (eu-central)
# Image: Ubuntu 22.04
# Add SSH key
```

### 2. Attach Block Storage
```bash
# Create 100 GB volume via Hetzner Console
# Attach to VM
# Mount at /mnt/HC_Volume_1
sudo mkfs.ext4 /dev/disk/by-id/scsi-0HC_Volume_XXXXX
sudo mkdir -p /mnt/HC_Volume_1
sudo mount /dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/HC_Volume_1

# Auto-mount on boot
echo '/dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/HC_Volume_1 ext4 defaults 0 0' | sudo tee -a /etc/fstab
```

### 3. Setup Supabase Project
```bash
# Create project at https://supabase.com
# Note down:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY

# Run migrations
cd database/migrations
psql "$SUPABASE_URL" -f *.sql
```

### 4. Configure Hetzner Object Storage
```bash
# Create S3-compatible bucket via Hetzner Console
# Note credentials:
# - HETZNER_S3_ENDPOINT
# - HETZNER_S3_ACCESS_KEY
# - HETZNER_S3_SECRET_KEY
# - HETZNER_S3_BUCKET
```

---

## Deployment Steps

### 1. Install Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository
```bash
cd /opt
git clone https://github.com/yourusername/n8n-production-backend.git
cd n8n-production-backend
```

### 3. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit .env with your secrets
nano .env
```

Required environment variables:
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AI Services
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=AIzxxx

# Hetzner Object Storage
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_BUCKET=flexoraa-backups
HETZNER_S3_ACCESS_KEY=xxx
HETZNER_S3_SECRET_KEY=xxx

# Monitoring
GRAFANA_PASSWORD=secure-password

# Domain
DOMAIN=yourdomain.com
```

### 4. Setup SSL Certificates
```bash
# Install certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Auto-renewal cron
echo "0 3 * * * certbot renew --quiet && docker-compose restart nginx" | sudo crontab -
```

### 5. Build & Deploy
```bash
# Build Docker images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

---

## Scaling Configuration

### For CX22 (4 GB RAM):
```yaml
# docker-compose.production.yml adjustments
spike-absorber:
  deploy:
    replicas: 2  # Reduced from 3

api:
  deploy:
    replicas: 1  # Reduced from 2

worker-a:
  deploy:
    replicas: 3  # Reduced from 5

worker-b:
  deploy:
    replicas: 1  # Reduced from 2

worker-c:
  deploy:
    replicas: 2  # Reduced from 3
```

**Total Containers:** ~10  
**Expected Memory Usage:** ~3.5 GB  
**Headroom:** 500 MB for OS

---

## Monitoring Access

- **Grafana:** https://monitoring.yourdomain.com
- **Prometheus:** http://your-ip:9090 (internal only)
- **Redis:** `redis-cli -h your-ip -p 6379`

---

## Backup Strategy

### Automated Daily Backups
```bash
# Backup service runs daily at 2 AM
# Uploads to Hetzner Object Storage:
# - Redis dump.rdb
# - Application logs
# - Supabase database dump (via pg_dump)
```

### Manual Backup
```bash
# Create snapshot
docker-compose -f docker-compose.production.yml exec redis redis-cli BGSAVE

# Backup to Object Storage
docker-compose -f docker-compose.production.yml exec backup /backup.sh
```

### Hetzner VM Snapshots
```bash
# Create weekly snapshots via Hetzner Console
# Retention: 4 weeks
# Cost: €0.01 per GB/month
```

---

## Health Checks

```bash
# API health
curl https://yourdomain.com/health

# Spike absorber health
curl http://localhost:8080/healthz

# Redis health
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# View logs
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

---

## Performance Tuning

### Redis Optimization
```bash
# Edit redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### NGINX Optimization
```nginx
# nginx/nginx.conf
worker_processes auto;
worker_connections 4096;
keepalive_timeout 65;
client_max_body_size 10M;
```

### Node.js Performance
```bash
# Set NODE_ENV=production
# Enable clustering in spike-absorber
# Use pm2 for process management (optional)
```

---

## Disaster Recovery

### Scenario 1: VM Failure
1. Provision new CX22 VM
2. Attach existing Block Storage volume
3. Restore from Hetzner VM snapshot
4. Point DNS to new IP

**RTO:** 15 minutes  
**RPO:** 24 hours (daily backup)

### Scenario 2: Data Corruption
1. Stop services: `docker-compose down`
2. Restore Redis from Object Storage backup
3. Restore Supabase from pg_dump backup
4. Restart services

**RTO:** 30 minutes  
**RPO:** 24 hours

---

##Migration to Hetzner CX32 (When needed)

**Trigger:** Consistent >80% CPU or RAM usage

**Steps:**
1. Create CX32 VM (4 vCPU, 8 GB RAM)
2. Attach same Block Storage volume
3. Clone setup, restore data
4. Update DNS
5. Delete old VM

**Scaling Capacity:**
- Spike absorber: 3 replicas
- API: 2 replicas
- Worker A: 5 replicas
- Worker B: 2 replicas
- Worker C: 3 replicas

---

## Cost Breakdown

| Resource | Monthly Cost (EUR) |
|----------|-------------------|
| CX22 VM | €5.83 |
| Block Storage (100 GB) | €4.00 |
| Object Storage (50 GB) | €2.50 |
| Snapshots (160 GB) | €1.60 |
| Supabase (free tier) | €0.00 |
| **Total** | **€13.93** |

---

## Next Steps After Deployment

1. ✅ Run smoke tests: `./scripts/smoke-test.sh`
2. ✅ Configure monitoring alerts in Grafana
3. ✅ Set up uptime monitoring (e.g., UptimeRobot)
4. ✅ Test backup/restore procedure
5. ✅ Load test with k6: `k6 run tests/k6/load-test.js`
6. ✅ Document runbooks for common issues

---

**Status:** Ready for production deployment on Hetzner CX22.

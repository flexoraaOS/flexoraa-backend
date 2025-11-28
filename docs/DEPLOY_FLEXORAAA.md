# Production Deployment Guide - flexoraaa.com

**Domain:** flexoraaa.com  
**Target:** Hetzner CX22 VM  
**Timeline:** This weekend (4-6 hours total)

---

## Prerequisites Checklist

- [x] Domain: flexoraaa.com (you have this!)
- [ ] Hetzner account
- [ ] Supabase account
- [ ] OpenAI API key
- [ ] Credit card for Hetzner billing

---

## Phase 1: Hetzner VM Setup (30 minutes)

### Step 1: Create Hetzner Account
1. Go to https://www.hetzner.com/cloud
2. Sign up with email
3. Add payment method (€12.33/month)

### Step 2: Provision CX22 Server
1. Click "Create Server"
2. **Location:** Nuremberg (Germany) or closest to you
3. **Image:** Ubuntu 22.04
4. **Type:** CX22 (2 vCPU, 4 GB RAM) - €5.83/month
5. **Networking:** Enable IPv4
6. **SSH Key:** Add your public key
   ```powershell
   # Generate SSH key (if you don't have one)
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   
   # Copy public key
   cat ~/.ssh/id_rsa.pub
   ```
7. **Server Name:** flexoraa-production
8. Click "Create & Buy Now"

### Step 3: Note Your Server IP
```
Example: 88.198.45.123 (you'll get this after creation)
Save this IP - you'll need it for DNS!
```

### Step 4: Attach Block Storage
1. Go to "Volumes" → "Create Volume"
2. **Size:** 100 GB (€4/month)
3. **Name:** flexoraa-data
4. **Attach to:** flexoraa-production
5. Click "Create & Buy Now"

### Step 5: Setup Object Storage (Backups)
1. Go to "Object Storage" → "Create Bucket"
2. **Name:** flexoraa-backups
3. **Location:** nbg1 (Nuremberg)
4. Note your S3 credentials:
   ```
   HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
   HETZNER_S3_ACCESS_KEY=xxxxx
   HETZNER_S3_SECRET_KEY=xxxxx
   ```

---

## Phase 2: DNS Configuration (10 minutes)

### Configure DNS Records

Go to your domain registrar (where you bought flexoraaa.com) and add these DNS records:

```
Type: A
Name: api
Value: <YOUR_HETZNER_IP>
TTL: 3600

Type: A
Name: monitoring
Value: <YOUR_HETZNER_IP>
TTL: 3600

Type: A  
Name: @
Value: <YOUR_HETZNER_IP>
TTL: 3600
```

**Result:**
- `api.flexoraaa.com` → Your backend API
- `monitoring.flexoraaa.com` → Grafana dashboard
- `flexoraaa.com` → Landing page (optional)

**Wait 5-10 minutes** for DNS to propagate, then test:
```powershell
ping api.flexoraaa.com
# Should return your Hetzner IP
```

---

## Phase 3: Supabase Setup (15 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up with GitHub or email
3. Click "New Project"
4. **Organization:** Create new (flexoraa)
5. **Name:** flexoraa-production
6. **Database Password:** Generate strong password (save it!)
7. **Region:** Central EU (closest to Hetzner)
8. Click "Create New Project"

### Step 2: Get Credentials
Once project is ready (2-3 minutes), go to **Project Settings** → **API**:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these!** You'll need them in your `.env` file.

### Step 3: Run Database Migrations
1. Go to **SQL Editor** in Supabase dashboard
2. Copy/paste each migration file from `database/migrations/`
3. Run them in order (001, 002, 003, etc.)

Or use the SQL editor to execute:
```sql
-- Paste content of database/migrations/001_initial_schema.sql
-- Then 002_add_campaigns.sql
-- Continue with all migrations...
```

---

## Phase 4: SSH into Hetzner & Deploy (1 hour)

### Step 1: Connect to Server
```bash
ssh root@<YOUR_HETZNER_IP>

# First time: Answer 'yes' to fingerprint question
```

### Step 2: Mount Block Storage
```bash
# Format volume (ONLY FIRST TIME!)
mkfs.ext4 /dev/disk/by-id/scsi-0HC_Volume_XXXXX

# Create mount point
mkdir -p /mnt/HC_Volume_1

# Mount volume
mount /dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/HC_Volume_1

# Auto-mount on reboot
echo '/dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/HC_Volume_1 ext4 defaults 0 0' >> /etc/fstab

# Create data directories
mkdir -p /mnt/HC_Volume_1/redis
mkdir -p /mnt/HC_Volume_1/backups
```

### Step 3: Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Clone Repository
```bash
# Install git
apt install git -y

# Clone your repo
cd /opt
git clone https://github.com/yourusername/n8n-production-backend.git
cd n8n-production-backend
```

### Step 5: Configure Environment Variables
```bash
# Create .env file
cp .env.example .env
nano .env
```

**Paste these values** (replace with your actual credentials):

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# JWT Secret (generate a strong one)
JWT_SECRET=your-super-secret-minimum-32-characters-long

# OpenAI (optional for now, can add later)
OPENAI_API_KEY=sk-proj-xxxxx

# Domain
DOMAIN=flexoraaa.com

# Hetzner S3
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_BUCKET=flexoraa-backups
HETZNER_S3_ACCESS_KEY=xxxxx
HETZNER_S3_SECRET_KEY=xxxxx

# Monitoring
GRAFANA_PASSWORD=choose-secure-password
```

**Save:** Ctrl+X, then Y, then Enter

### Step 6: Get SSL Certificate
```bash
# Install certbot
apt install certbot -y

# Get certificates
certbot certonly --standalone -d api.flexoraaa.com -d monitoring.flexoraaa.com

# Copy to nginx directory
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/api.flexoraaa.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/api.flexoraaa.com/privkey.pem nginx/ssl/

# Setup auto-renewal
echo "0 3 * * * certbot renew --quiet && docker-compose -f /opt/n8n-production-backend/docker-compose.production.yml restart nginx" | crontab -
```

### Step 7: Update NGINX Config
```bash
nano nginx/nginx.conf

# Find and replace:
# yourdomain.com → flexoraaa.com
# (Should appear in 3 places: server_name directives)

# Save: Ctrl+X, Y, Enter
```

### Step 8: Deploy!
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# All containers should show "Up"
```

### Step 9: View Logs
```bash
# Follow all logs
docker-compose -f docker-compose.production.yml logs -f

# Or specific service
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f redis
```

---

## Phase 5: Validate Deployment (30 minutes)

### Test 1: Health Check
```bash
curl https://api.flexoraaa.com/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123}
```

### Test 2: API Authentication
```bash
# Generate a test JWT token (temporarily disable auth or use test token)
curl https://api.flexoraaa.com/api/leads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return 200 or 401 (not 500)
```

### Test 3: Database Connection
```bash
# Check logs for database connection
docker-compose -f docker-compose.production.yml logs api | grep -i "database\|postgres"

# Should see "Connected to database" or similar
```

### Test 4: Redis Connection
```bash
# Test Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli PING

# Expected: PONG
```

### Test 5: Monitoring
Open in browser:
- https://monitoring.flexoraaa.com
- Login with Grafana credentials from .env
- Should see dashboards loading

---

## Phase 6: Send First Real Webhook (15 minutes)

### Create Test JWT Token
```bash
# On your local machine or server
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user', role: 'admin', tenantId: 'test-tenant' },
  'your-super-secret-minimum-32-characters-long', // Must match .env JWT_SECRET
  { expiresIn: '24h' }
);
console.log(token);
"
```

### Send Webhook
```bash
curl -X POST https://api.flexoraaa.com/api/webhooks/leados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_ABOVE" \
  -d '{
    "user_id": "test-123",
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'

# Expected: 202 Accepted or 200 OK
```

### Verify in Database
```bash
# Query Supabase
psql "$SUPABASE_URL" -c "SELECT * FROM leads WHERE user_id = 'test-123';"

# Should see your test lead!
```

---

## Troubleshooting

### Issue: Can't access api.flexoraaa.com
```bash
# Check DNS
ping api.flexoraaa.com

# Check NGINX status
docker-compose ps nginx

# Check NGINX logs
docker-compose logs nginx
```

### Issue: SSL certificate error
```bash
# Check certificate files exist
ls -la nginx/ssl/

# Regenerate if needed
certbot certonly --standalone -d api.flexoraaa.com --force-renew
```

### Issue: Database connection failed
```bash
# Test Supabase connection manually
psql "$SUPABASE_URL"

# Check API logs for connection errors
docker-compose logs api | grep -i error
```

### Issue: Redis connection failed
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis
docker-compose exec redis redis-cli PING
```

---

## Success Criteria ✅

After following this guide, you should have:

- [ ] Hetzner VM running with Docker
- [ ] DNS pointing to your server (api.flexoraaa.com)
- [ ] SSL certificate active (https works)
- [ ] All Docker containers running
- [ ] Database migrations completed
- [ ] Redis operational
- [ ] First webhook successfully processed
- [ ] Data visible in Supabase
- [ ] Monitoring dashboard accessible

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check logs for errors
   - Verify auto-restart works
   - Test SSL auto-renewal

2. **Run Load Tests**
   ```bash
   k6 run tests/k6/load-test.js --vus 10 --duration 2m
   ```

3. **Setup Alerts**
   - Configure email alerts in Grafana
   - Add UptimeRobot monitoring

4. **Document Issues**
   - Keep log of any errors
   - Note performance metrics
   - Track response times

---

**Ready to start?** Begin with Phase 1 (Hetzner setup) this weekend! 🚀

**Estimated total time:** 4-6 hours  
**Monthly cost:** €12.33 + €10 OpenAI credits = **€22.33**

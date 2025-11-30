# Flexoraa Intelligence OS - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Redis installed (optional but recommended)

### Step 1: Clone & Install
```bash
# Install backend dependencies
cd api
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Database Setup
```bash
# Run all migrations
psql $DATABASE_URL -f database/migrations/001_core_schema.sql
psql $DATABASE_URL -f database/migrations/029_missing_tables.sql
# ... run all other migrations in order
```

Or use the migration script:
```bash
cd scripts
./migrate.sh  # Linux/Mac
migrate.bat   # Windows
```

### Step 3: Environment Configuration
```bash
# Copy environment templates
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env.local

# Edit api/.env with your credentials
nano api/.env
```

**Minimum required variables:**
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI
GEMINI_API_KEY=your-gemini-key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID_PRIMARY=your-phone-id

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret
```

### Step 4: Start Services
```bash
# Terminal 1: Start backend
cd api
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 5: Verify Installation
Open your browser:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:3001/health
- API Docs: http://localhost:3001/api

Check backend logs for:
```
✅ Lead leakage prevention service started
✅ SLA monitoring service started
✅ Gmail polling service started
✅ Cold recovery scheduler started
✅ Token threshold checker started
```

## 🎯 Quick Feature Tests

### Test 1: Token Balance
```bash
curl http://localhost:3001/api/tokens/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Create Lead
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Lead",
    "phone_number": "+1234567890",
    "message": "I want to buy your product"
  }'
```

### Test 3: Start AI Qualification
The qualification will start automatically when a lead is created. Check the lead's qualification state:
```bash
curl http://localhost:3001/api/leads/{leadId}/qualification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 4: Monitor SLA
```bash
curl http://localhost:3001/api/monitoring/sla/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 Access Dashboards

### Main Dashboard
http://localhost:3000/dashboard

### Billing & Tokens
http://localhost:3000/dashboard/billing

### System Monitoring
http://localhost:3000/dashboard/monitoring

### Lead Management
http://localhost:3000/dashboard/leads

## 🔧 Common Issues

### Issue: Services not starting
**Solution:** Check if all environment variables are set
```bash
cd api
node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY ? '✅ Gemini configured' : '❌ Missing GEMINI_API_KEY')"
```

### Issue: Database connection failed
**Solution:** Verify DATABASE_URL or Supabase credentials
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: WhatsApp messages not sending
**Solution:** Check WhatsApp credentials and enable sending
```bash
# In api/.env
ENABLE_WHATSAPP_SENDING=true
WHATSAPP_ACCESS_TOKEN=your-valid-token
```

### Issue: Token deduction not working
**Solution:** Ensure token_balances table has initial balance
```sql
INSERT INTO token_balances (tenant_id, balance)
VALUES ('your-tenant-id', 1000)
ON CONFLICT (tenant_id) DO UPDATE SET balance = 1000;
```

## 📚 Next Steps

1. **Configure Integrations**
   - Connect Gmail: `/dashboard/settings/integrations`
   - Connect Instagram: Follow Meta setup guide
   - Connect Facebook: Follow Meta setup guide

2. **Set Up WhatsApp Templates**
   - Go to Meta Business Manager
   - Create templates: `welcome_message`, `follow_up`, `cold_recovery`
   - Wait for approval (24-48 hours)

3. **Configure Razorpay**
   - Create account at https://razorpay.com
   - Get API keys from dashboard
   - Add to `.env` file

4. **Test Payment Flow**
   - Go to `/dashboard/billing`
   - Select token pack
   - Complete test payment

5. **Monitor System**
   - Check `/dashboard/monitoring` for SLA metrics
   - Review logs in `api/logs/`
   - Set up alerts for violations

## 🎓 Learn More

- **Full Documentation:** See `IMPLEMENTATION_COMPLETE.md`
- **PRD Specifications:** See `PRD_v2.md`
- **API Reference:** See individual route files in `api/src/routes/`
- **Service Documentation:** See service files in `api/src/services/`

## 💡 Pro Tips

1. **Use Redis for better performance**
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Enable all feature flags**
   ```env
   ENABLE_AI_QUALIFICATION=true
   ENABLE_COLD_RECOVERY=true
   ENABLE_LEAKAGE_PREVENTION=true
   ENABLE_SLA_MONITORING=true
   ```

3. **Monitor token usage**
   - Set up daily email reports
   - Check threshold alerts
   - Review usage statistics

4. **Test in sandbox mode first**
   ```env
   WHATSAPP_SANDBOX_MODE=true
   NODE_ENV=development
   ```

## 🆘 Get Help

If you encounter issues:
1. Check logs: `tail -f api/logs/app.log`
2. Review error messages in browser console
3. Verify all environment variables are set
4. Check database migrations are complete
5. Ensure all services are running

## ✅ Production Checklist

Before going live:
- [ ] All migrations run successfully
- [ ] Environment variables configured
- [ ] WhatsApp templates approved
- [ ] Razorpay in live mode
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Load testing completed
- [ ] Security audit passed

---

**Ready to scale?** Your Flexoraa Intelligence OS is now operational! 🎉

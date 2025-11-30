# Frontend-Backend Connection Guide

## Current Connection Status

### ⚠️ ISSUE: Frontend points to wrong URL

**Frontend Configuration:**
- Currently pointing to: `http://localhost:3000` (Next.js itself)
- Should point to: `http://localhost:3001` (Backend API)

**Backend Configuration:**
- Running on: `http://localhost:3001`
- CORS: Enabled (accepts all origins)

## How to Fix

### Update Frontend Environment Variable

**File:** `frontend/.env.local`

```env
# ============================================
# FLEXORAA FRONTEND - DEVELOPMENT
# ============================================

# Backend API (CRITICAL - must point to backend port)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001/mock-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key

# Meta/Facebook
NEXT_PUBLIC_META_APP_ID=1332609241770996

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_mock

# Google AI
GOOGLE_API_KEY=AIzaSy_mock-key-for-development
```

### Verify Connection

**1. Start Backend (Terminal 1):**
```bash
cd api
npm run dev
# Should show: "Server running on port 3001"
```

**2. Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# Should show: "Ready on http://localhost:3000"
```

**3. Test API Connection:**
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend should now call backend at :3001
```

## API Endpoints Available

### Backend (Port 3001)

**Health:**
- `GET /health` - Server health check

**Authentication:**
- `POST /api/auth/login`
- `POST /api/auth/register`

**Leads:**
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/:id`
- `PUT /api/leads/:id`

**Webhooks:**
- `POST /api/webhooks/whatsapp`
- `POST /api/webhooks/instagram`
- `POST /api/webhooks/facebook`

**Billing:**
- `GET /api/billing/balance`
- `POST /api/billing/top-up`
- `POST /api/billing/razorpay-webhook`

**Subscriptions:**
- `POST /api/subscriptions/create`
- `POST /api/subscriptions/cancel`

**Analytics:**
- `GET /api/analytics/roi`

**Appointments:**
- `GET /api/appointments/slots/:leadId`
- `POST /api/appointments/book`

## Frontend API Calls

The frontend uses these patterns to call the backend:

```typescript
// Example from frontend code
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/messages/whatsapp`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }
);
```

**After setting `NEXT_PUBLIC_API_URL=http://localhost:3001`:**
- ✅ Frontend calls will go to backend at port 3001
- ✅ Backend will process and return responses
- ✅ CORS is already enabled in backend

## Configuration Files

### Backend: `api/.env`
```env
PORT=3001
NODE_ENV=development
# ... other backend config
```

### Frontend: `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# ... other frontend config
```

## Quick Fix Command

Run this to create the correct frontend .env.local:

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001/mock-supabase" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key" >> .env.local
echo "NEXT_PUBLIC_META_APP_ID=1332609241770996" >> .env.local
echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_mock" >> .env.local
echo "GOOGLE_API_KEY=AIzaSy_mock-key-for-development" >> .env.local
```

## Production Configuration

For production deployment:

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Backend:**
```env
PORT=3001
NODE_ENV=production
# Add actual API keys
```

## Summary

**Problem:** Frontend defaults to `localhost:3000` (itself) instead of backend at `localhost:3001`

**Solution:** Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `frontend/.env.local`

**Status:** Backend is ready and waiting. Just needs frontend to point to correct URL.

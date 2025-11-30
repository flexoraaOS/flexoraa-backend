# Vercel Build Fix - Supabase Admin Environment Variable

## Problem

The Vercel build was failing with the error:

```
Error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable
```

This occurred during the build phase when Next.js was trying to collect page data for prerendering.

## Root Cause

The `supabaseAdmin` client in `src/lib/api/supabase-admin.ts` was being initialized at the **module level** (when the file was imported), which meant it tried to access the `SUPABASE_SERVICE_ROLE_KEY` environment variable during the build phase.

During local development, this works fine because `.env.local` is available. However, on Vercel during the build phase, only `NEXT_PUBLIC_*` environment variables are available. The `SUPABASE_SERVICE_ROLE_KEY` is only available at **runtime** (when the API routes are actually called).

## Solution Implemented

### 1. Refactored `supabase-admin.ts`

Changed from exporting a client instance to exporting a **factory function**:

**Before:**

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {...});
```

**After:**

```typescript
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {...});
};
```

### 2. Updated All API Routes

Updated all API routes that use the Supabase admin client:

- `src/app/api/payments/route.ts`
- `src/app/api/razorpay/webhook/route.ts`
- `src/app/api/razorpay/verify-payment/route.ts`
- `src/app/api/auth/auto-register/route.ts` (moved env vars inside the handler)
- `src/lib/generateInvoice.ts` (updated dynamic import)

**Change Pattern:**

```typescript
// Old
import { supabaseAdmin } from "@/lib/api/supabase-admin";
const supabase = supabaseAdmin;

// New
import { getSupabaseAdmin } from "@/lib/api/supabase-admin";
const supabase = getSupabaseAdmin();
```

## Why This Fixes The Issue

1. **Lazy Evaluation**: The environment variable is now only accessed when `getSupabaseAdmin()` is **called** (at runtime), not when the module is **imported** (at build time).

2. **API Routes are Runtime Only**: API routes in Next.js only execute at runtime (when a request is made), never during the build phase. By moving the environment variable access into the function, it's only evaluated when the API route is actually called.

3. **No Build-Time Execution**: The build process no longer tries to access `SUPABASE_SERVICE_ROLE_KEY`, preventing the build error.

## Vercel Configuration Required

Even though the code is now fixed, you **MUST** add the environment variable in Vercel:

### Steps:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Your Supabase service role key (from Supabase Dashboard → Settings → API)
   - **Environment**: Production, Preview, Development (select all)

### Other Required Environment Variables:

Ensure these are also set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RESEND_API_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Testing

After deploying with these changes:

1. **Local Build Test**:

   ```bash
   npm run build
   ```

   This should now succeed locally (with `.env.local` present).

2. **Vercel Deploy Test**:

   - Push the changes to your repository
   - Ensure environment variables are set in Vercel
   - Trigger a new deployment
   - The build should complete successfully

3. **Runtime Test**:
   - Test the following API endpoints:
     - `/api/payments`
     - `/api/razorpay/verify-payment`
     - `/api/auth/auto-register`
   - Ensure they can successfully connect to Supabase

## Summary

✅ **Code Changes**: Converted `supabaseAdmin` from a module-level constant to a runtime factory function  
✅ **API Routes**: Updated all API routes to use `getSupabaseAdmin()`  
✅ **Build Phase**: Environment variables are now only accessed at runtime  
🔔 **Action Required**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

The build should now succeed on Vercel! 🚀

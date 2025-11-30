import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client for Client Components
 * 
 * Use this in:
 * - Client Components ("use client")
 * - Browser-side code
 * 
 * This properly handles cookies in the browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

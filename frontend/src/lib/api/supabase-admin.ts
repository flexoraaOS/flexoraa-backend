import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * This client uses the service role key and should ONLY be used in:
 * - API routes (server-side)
 * - Server actions
 * - Backend operations that require elevated permissions
 * 
 * NEVER use this client in client-side components!
 */

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

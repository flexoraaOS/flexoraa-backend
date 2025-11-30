import { createClient } from '@supabase/supabase-js';

/**
 * Legacy Supabase Client
 * 
 * DEPRECATED: Use the appropriate client based on your context:
 * - Client Components: import { createClient } from '@/lib/api/supabase-client'
 * - Server Components: import { createClient } from '@/lib/api/supabase-server'
 * - API Routes (admin): import { supabaseAdmin } from '@/lib/api/supabase-admin'
 * 
 * This client is kept for backward compatibility but may not handle
 * authentication cookies properly in all contexts.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

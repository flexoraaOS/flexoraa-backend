# Flexoraa Database Migration Guide

## Quick Start

### For Fresh Database Setup

If you're setting up a fresh Supabase database, follow these steps:

```bash
# 1. Make sure you have Supabase CLI installed
npm install -g supabase

# 2. Link to your Supabase project
supabase link --project-ref fgcmqlzhvkjapvlgfxfi

# 3. Push all migrations
supabase db push
```

### For Manual Setup (Supabase Dashboard)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/fgcmqlzhvkjapvlgfxfi/sql
   
2. **Run Migrations in Order**
   - Copy and paste each migration file content into the SQL Editor
   - Run them in numerical order (00000, 00001, 00002, etc.)
   - Wait for each to complete successfully before moving to the next

3. **Verify Success**
   - Each migration ends with a verification SELECT statement
   - You should see a success message after each migration

## Migration Files Overview

### 1. Initial Setup (00000)
Creates the foundational function for handling `updated_at` timestamps across all tables.

### 2. Core User Tables (00001-00002)
- **Profiles**: User profiles extending Supabase Auth
- **Company**: Company/business information

### 3. Lead Management (00003-00005)
- **Campaigns**: Marketing campaign management
- **Leads**: Lead/contact information and tracking
- **Contact History**: Communication history with leads

### 4. Integrations & Team (00006-00007)
- **Credentials**: Meta API credentials for WhatsApp/Instagram/Facebook
- **Team Members**: Team collaboration and invitations

### 5. Scheduling & Billing (00008-00010)
- **Appointments**: Meeting and appointment scheduling
- **Subscriptions**: Subscription plan management
- **Payments**: Payment transaction tracking

### 6. Communication & Public (00011-00012)
- **Messages**: Internal user-to-user messaging
- **Contacts & Feedback**: Public contact forms and feedback

### 7. Storage (00013)
- **Storage Buckets**: File storage for avatars, logos, invoices, documents

## Advanced Topics

### Rolling Back a Migration

If you need to roll back a migration:

```sql
-- Example: Rolling back the appointments table
DROP TRIGGER IF EXISTS handle_updated_at ON public.appointments;
DROP TABLE IF EXISTS public.appointments CASCADE;
```

⚠️ **Warning**: Rolling back migrations can cause data loss. Always backup first!

### Adding Custom Fields

To add custom fields to existing tables, create a new migration:

```sql
-- Example: supabase/migrations/20250120000014_add_custom_fields.sql
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS custom_field text;

-- Update RLS policies if needed
```

### Modifying Policies

To modify existing policies, create a new migration:

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;

-- Create the new policy with updated logic
CREATE POLICY "Users can view own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id OR role = 'admin');
```

## Database Maintenance

### Checking Database Health

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check RLS policies
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### Performance Optimization

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim storage
VACUUM ANALYZE;

-- Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) ASC;
```

## Testing Your Database

After running migrations, test your database setup:

```sql
-- Test 1: Create a test profile
INSERT INTO public.profiles (id, full_name, role)
VALUES (auth.uid(), 'Test User', 'user');

-- Test 2: Create a test lead
INSERT INTO public.leads (user_id, phone_number, name, stage)
VALUES (auth.uid(), '+1234567890', 'Test Lead', 'new');

-- Test 3: Query your data
SELECT * FROM public.profiles WHERE id = auth.uid();
SELECT * FROM public.leads WHERE user_id = auth.uid();

-- Test 4: Clean up test data
DELETE FROM public.leads WHERE phone_number = '+1234567890';
DELETE FROM public.profiles WHERE full_name = 'Test User';
```

## Common SQL Patterns

### Checking if a Table Exists

```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'your_table_name'
);
```

### Checking if a Column Exists

```sql
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'your_table' 
    AND column_name = 'your_column'
);
```

### Adding a Column Safely

```sql
ALTER TABLE public.your_table 
ADD COLUMN IF NOT EXISTS your_column text;
```

### Creating Indexes for Performance

```sql
-- Single column index
CREATE INDEX IF NOT EXISTS idx_leads_email 
ON public.leads(email);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_leads_user_stage 
ON public.leads(user_id, stage);

-- Partial index (for specific conditions)
CREATE INDEX IF NOT EXISTS idx_active_leads 
ON public.leads(user_id) 
WHERE stage = 'new' AND contacted = false;
```

## Environment-Specific Migrations

### Development
```bash
# Use local Supabase
supabase start
supabase db push
```

### Staging
```bash
# Link to staging project
supabase link --project-ref your-staging-ref
supabase db push
```

### Production
```bash
# Link to production project
supabase link --project-ref fgcmqlzhvkjapvlgfxfi
supabase db push

# Or use the dashboard for production
# https://supabase.com/dashboard/project/fgcmqlzhvkjapvlgfxfi/sql
```

## Best Practices

1. ✅ **Always use transactions** for complex migrations
2. ✅ **Test in development** before running in production
3. ✅ **Backup your database** before major migrations
4. ✅ **Use IF NOT EXISTS** for idempotent migrations
5. ✅ **Document your migrations** with comments
6. ✅ **Version control** all migration files
7. ✅ **Run migrations during low-traffic periods**
8. ✅ **Monitor performance** after migrations
9. ✅ **Keep migrations small** and focused
10. ✅ **Never edit** migrations that have been run in production

## Emergency Procedures

### If a Migration Fails

1. **Don't panic** - migrations are designed to be idempotent
2. **Check the error message** - it usually tells you what went wrong
3. **Fix the issue** in the migration file
4. **Re-run the migration** - it should handle existing objects gracefully
5. **Verify the results** using the verification queries

### If Data is Lost

1. **Stop all operations** immediately
2. **Restore from backup** if available
3. **Check Supabase dashboard** for point-in-time recovery options
4. **Contact Supabase support** if needed

### If RLS is Blocking Access

1. **Check authentication** - make sure you're logged in
2. **Review policies** in the migration files
3. **Temporarily disable RLS** for debugging (not recommended for production):
   ```sql
   ALTER TABLE public.your_table DISABLE ROW LEVEL SECURITY;
   ```
4. **Re-enable RLS** after debugging:
   ```sql
   ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
   ```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For migration issues:
1. Check this guide first
2. Review the migration files for inline comments
3. Check Supabase status: https://status.supabase.com/
4. Contact the development team

---

Last Updated: 2025-01-20

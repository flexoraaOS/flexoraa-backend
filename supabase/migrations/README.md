# Flexoraa Supabase Migrations

This directory contains all database migrations for the Flexoraa platform. These migrations are designed to be run sequentially to set up the complete database schema.

## 📋 Migration Overview

### Core Migrations (Run in Order)

1. **20250120000000_initial_setup.sql**
   - Creates the `handle_updated_at()` function used across all tables
   - Must be run first as other tables depend on this function

2. **20250120000001_create_profiles_table.sql**
   - Creates the profiles table (extends auth.users)
   - Includes user roles, names, AI persona settings, and usage limits
   - Fields: role, full_name, first_name, last_name, agent_name, agent_persona, business_info, leados_limit, agentos_limit

3. **20250120000002_create_company_table.sql**
   - Creates the company table for business information
   - Fields: company_name, company_type, industry, sector, company_size, website, address, city, state, country, postal_code, phone, gst_number, gst_rate, description, logo_url

4. **20250120000003_create_campaigns_table.sql**
   - Creates the campaigns table for marketing campaigns
   - Fields: name, description, start_date, end_date, status

5. **20250120000004_create_leads_table.sql**
   - Creates the leads table for lead management
   - Fields: name, phone_number, email, tags, status, temperature, campaign_id, metadata, has_whatsapp, conversation_score, followup_date, followup_time, closed, contacted, booked_timestamp, stage, note

6. **20250120000005_create_contact_history_table.sql**
   - Creates the contact_history table for tracking communications
   - Fields: campaign_id, lead_id, direction, message_text, message_type, platform, status, metadata, sent_at

7. **20250120000006_create_credentials_table.sql**
   - Creates the credentials table for Meta API credentials
   - Fields: business_manager_id, business_account_id, phone_number_id, meta_access_token, token_expires_at, instagram_account_id, facebook_page_id

8. **20250120000007_create_team_members_table.sql**
   - Creates the team_members table for team management
   - Fields: email, first_name, last_name, role, status, invited_by, invited_at, accepted_at, last_login

9. **20250120000008_create_appointments_table.sql**
   - Creates the appointments table for scheduling
   - Fields: lead_id, title, description, start_time, end_time, scheduled_at, duration_minutes, status, location, meeting_link, timezone, notes

10. **20250120000009_create_subscriptions_table.sql**
    - Creates the subscriptions table for subscription management
    - Fields: plan_name, plan_type, status, current_period_start, current_period_end, cancel_at, canceled_at, trial_start, trial_end, razorpay_payment_id, razorpay_order_id, razorpay_subscription_id, amount, currency

11. **20250120000010_create_payments_table.sql**
    - Creates the payments table for payment tracking
    - Fields: order_id, payment_id, signature, amount, currency, status, payment_method, invoice_url, invoice_number, description, metadata

12. **20250120000011_create_messages_table.sql**
    - Creates the messages table for internal messaging
    - Fields: sender_id, receiver_id, content, read

13. **20250120000012_create_public_tables.sql**
    - Creates public tables (contacts, feedback)
    - contacts fields: name, email, phone, company, message, source
    - feedback fields: name, email, feedback, rating

14. **20250120000013_create_storage_buckets.sql**
    - Creates storage buckets and policies
    - Buckets: avatars, company-logos, invoices, documents

## 🚀 How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/fgcmqlzhvkjapvlgfxfi
2. Navigate to SQL Editor
3. Run each migration file in order (starting from 20250120000000)
4. Verify each migration completes successfully before proceeding to the next

### Option 2: Supabase CLI

```bash
# Navigate to the project root
cd /path/to/flexoraa

# Run migrations
supabase db push
```

### Option 3: Manual Execution

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.fgcmqlzhvkjapvlgfxfi.supabase.co:5432/postgres"

# Run each migration
\i supabase/migrations/20250120000000_initial_setup.sql
\i supabase/migrations/20250120000001_create_profiles_table.sql
# ... continue for all migrations
```

## 🔒 Security Features

All tables include:
- **Row Level Security (RLS)** enabled
- **Policies** for SELECT, INSERT, UPDATE, DELETE operations
- **User isolation** - users can only access their own data
- **Proper foreign key constraints** with CASCADE delete where appropriate
- **Indexes** for optimal query performance

## 📊 Database Schema Relationships

```
auth.users (Supabase Auth)
    ├── profiles (1:1)
    ├── company (1:1)
    ├── campaigns (1:many)
    ├── leads (1:many)
    │   ├── appointments (1:many)
    │   └── contact_history (1:many)
    ├── credentials (1:1)
    ├── team_members (1:many as invited_by)
    ├── subscriptions (1:many)
    ├── payments (1:many)
    └── messages (many:many via sender_id and receiver_id)
```

## 🔄 Updating the Schema

When adding new migrations:

1. Create a new migration file with the next sequential timestamp
2. Use the naming convention: `YYYYMMDDHHMMSS_description.sql`
3. Include idempotent SQL (use `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.)
4. Add verification SELECT statement at the end
5. Update this README with the new migration details

## ⚠️ Important Notes

- **Always backup your database** before running migrations in production
- **Test migrations** in a development environment first
- **Run migrations in order** - they have dependencies
- **Do not modify** existing migration files after they've been run in production
- **Create new migrations** for schema changes instead of modifying existing ones

## 🧪 Verification

After running all migrations, verify the setup:

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check storage buckets
SELECT * FROM storage.buckets;
```

## 📝 Migration Checklist

- [ ] Run migration 00000 (initial_setup)
- [ ] Run migration 00001 (profiles_table)
- [ ] Run migration 00002 (company_table)
- [ ] Run migration 00003 (campaigns_table)
- [ ] Run migration 00004 (leads_table)
- [ ] Run migration 00005 (contact_history_table)
- [ ] Run migration 00006 (credentials_table)
- [ ] Run migration 00007 (team_members_table)
- [ ] Run migration 00008 (appointments_table)
- [ ] Run migration 00009 (subscriptions_table)
- [ ] Run migration 00010 (payments_table)
- [ ] Run migration 00011 (messages_table)
- [ ] Run migration 00012 (public_tables)
- [ ] Run migration 00013 (storage_buckets)
- [ ] Verify all tables are created
- [ ] Verify RLS is enabled on all tables
- [ ] Verify policies are in place
- [ ] Test basic CRUD operations

## 🆘 Troubleshooting

### Common Issues

1. **"function handle_updated_at() does not exist"**
   - Make sure you ran migration 00000 first

2. **"relation does not exist"**
   - Check that you're running migrations in order
   - Verify dependencies are satisfied

3. **"policy already exists"**
   - Migrations use `DROP POLICY IF EXISTS` to handle this
   - You can safely re-run the migration

4. **RLS blocking access**
   - Ensure you're authenticated as the correct user
   - Check policy definitions in the migration files

## 📞 Support

For issues or questions about migrations:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the migration files for comments and structure
3. Contact the development team

## 📜 License

These migrations are part of the Flexoraa platform and follow the project's license terms.

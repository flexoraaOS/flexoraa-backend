# Migration Changelog

## Version 2025-01-20 - Complete Database Restructure

### Overview
Complete restructure and consolidation of all database migrations into a clean, sequential format. All migrations are now idempotent and can be safely re-run.

### New Migration Structure

#### Core Setup
- **20250120000000_initial_setup.sql**
  - Created `handle_updated_at()` function for automatic timestamp management
  - Foundation for all other migrations

#### User Management
- **20250120000001_create_profiles_table.sql**
  - Extended auth.users with profile information
  - Added AI persona fields (agent_name, agent_persona, business_info)
  - Added usage limits (leados_limit, agentos_limit)
  - Includes first_name, last_name fields

- **20250120000002_create_company_table.sql**
  - Complete company information management
  - Support for GST/tax information
  - Address and contact details
  - Industry and sector classification

#### Lead Management System
- **20250120000003_create_campaigns_table.sql**
  - Marketing campaign tracking
  - Campaign lifecycle management (draft, active, paused, archived)

- **20250120000004_create_leads_table.sql**
  - Comprehensive lead tracking
  - Multi-stage pipeline (new → contacted → qualified → converted/booked)
  - Temperature tracking (hot, warm, cold, natural)
  - WhatsApp verification support
  - Follow-up scheduling
  - Conversation scoring

- **20250120000005_create_contact_history_table.sql**
  - Multi-channel communication tracking (WhatsApp, Instagram, Messenger, Email, SMS, Call)
  - Inbound/outbound message tracking
  - Message status tracking (sent, delivered, read, failed)
  - Metadata support for rich message information

#### Integration & Collaboration
- **20250120000006_create_credentials_table.sql**
  - Meta API credentials storage
  - WhatsApp Business API support
  - Instagram and Facebook integration
  - Secure token management with expiration tracking

- **20250120000007_create_team_members_table.sql**
  - Team collaboration features
  - Role-based access (admin, manager, member, viewer)
  - Invitation workflow
  - Status tracking (active, pending, inactive)

#### Scheduling & Appointments
- **20250120000008_create_appointments_table.sql**
  - Meeting scheduling
  - Lead-linked appointments
  - Timezone support
  - Multiple status tracking (scheduled, completed, cancelled, no-show)
  - Meeting link integration

#### Billing & Payments
- **20250120000009_create_subscriptions_table.sql**
  - Subscription plan management
  - Trial period support
  - Multiple plan types (free, starter, professional, enterprise)
  - Razorpay integration
  - Cancellation tracking

- **20250120000010_create_payments_table.sql**
  - Payment transaction tracking
  - Multiple payment methods
  - Invoice generation support
  - Refund tracking
  - Metadata for custom payment information

#### Communication
- **20250120000011_create_messages_table.sql**
  - Internal user-to-user messaging
  - Read status tracking
  - Real-time communication support

#### Public Features
- **20250120000012_create_public_tables.sql**
  - Contact form submissions
  - User feedback collection
  - Rating system

#### Storage
- **20250120000013_create_storage_buckets.sql**
  - Avatar storage (public)
  - Company logo storage (public)
  - Invoice storage (private)
  - Document storage (private)
  - Complete RLS policies for all buckets

### Key Features Across All Migrations

#### Security
✅ Row Level Security (RLS) enabled on all tables
✅ Comprehensive policies for SELECT, INSERT, UPDATE, DELETE
✅ User isolation - users only access their own data
✅ Proper CASCADE delete on foreign keys
✅ Storage bucket policies with user-specific access

#### Performance
✅ Strategic indexes on frequently queried columns
✅ Foreign key indexes for join optimization
✅ Composite indexes where beneficial
✅ Partial indexes for specific query patterns

#### Maintainability
✅ Idempotent migrations (safe to re-run)
✅ Clear naming conventions
✅ Comprehensive comments
✅ Verification queries in each migration
✅ DROP IF EXISTS for all policies

#### Data Integrity
✅ Foreign key constraints
✅ CHECK constraints for enum-like fields
✅ UNIQUE constraints where appropriate
✅ NOT NULL constraints for required fields
✅ Default values for sensible defaults

### Breaking Changes
None - this is a fresh migration structure. If you have existing data:
1. Backup your current database
2. Export existing data
3. Run new migrations
4. Import data using provided scripts

### Migration from Old Structure

If upgrading from previous migration structure:

```sql
-- Check existing tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Backup data before migration
-- Use pg_dump or Supabase backup features
```

### Rollback Instructions

If you need to rollback (⚠️ will cause data loss):

```sql
-- Rollback in reverse order
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.credentials CASCADE;
DROP TABLE IF EXISTS public.contact_history CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.company CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('avatars', 'company-logos', 'invoices', 'documents');
```

### Testing Checklist

After running migrations:

- [ ] All 14 migrations executed successfully
- [ ] All tables created (verify with `\dt` or dashboard)
- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Storage buckets created
- [ ] Storage policies applied
- [ ] Indexes created
- [ ] Foreign keys working
- [ ] Triggers functioning
- [ ] Can create test records
- [ ] RLS policies allow proper access
- [ ] RLS policies block unauthorized access

### Known Issues
None at this time.

### Future Enhancements

Planned for future migrations:
- Notification preferences table
- Audit log table
- Analytics tables
- Custom fields support
- Workflow automation tables
- Email templates table
- SMS templates table

### Documentation

- **README.md**: Overview of all migrations
- **MIGRATION_GUIDE.md**: Detailed guide for running and managing migrations
- **CHANGELOG.md**: This file - tracks all changes

### Support

For issues or questions:
1. Review the README.md and MIGRATION_GUIDE.md
2. Check Supabase documentation
3. Review inline comments in migration files
4. Contact development team

---

## Previous Versions

### Legacy Migrations (Deprecated)
- 20250115000000_add_subscriptions_and_persona.sql
- 20251029000000_meta_api_credentials.sql
- 20251114000000_create_company_table.sql
- 20251114000001_create_team_members_table.sql
- 20251114000002_create_appointments_table.sql
- 20251116000000_final_schema_verification.sql

These have been superseded by the new migration structure and should not be used for new installations.

---

**Version**: 2025-01-20
**Status**: Production Ready
**Last Updated**: January 20, 2025

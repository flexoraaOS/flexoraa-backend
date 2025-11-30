-- Full Migration Backup for Flexoraa (supabase/migration-backup)
-- This file applies all migrations in chronological order as a single SQL script.
-- Run it against a non-production/staging copy first. Use the Supabase SQL editor, psql, or the Supabase CLI.

-- IMPORTANT: Many migrations enable Row Level Security and create policies/triggers. Run carefully.

-- ------------------------------
-- 2025-01-15 - Add Subscriptions and Persona (backup)
-- ------------------------------
\i 20250115000000_add_subscriptions_and_persona.sql

-- ------------------------------
-- 2025-10-29 - Meta API Credentials (backup)
-- ------------------------------
\i 20251029000000_meta_api_credentials.sql

-- ------------------------------
-- 2025-11-14 - Create Company Table (backup)
-- ------------------------------
\i 20251114000000_create_company_table.sql

-- ------------------------------
-- 2025-11-14 - Create Team Members Table (backup)
-- ------------------------------
\i 20251114000001_create_team_members_table.sql

-- ------------------------------
-- 2025-11-14 - Create Appointments Table (backup)
-- ------------------------------
\i 20251114000002_create_appointments_table.sql

-- ------------------------------
-- 2025-11-16 - Final Schema Verification (backup)
-- ------------------------------
\i 20251116000000_final_schema_verification.sql

-- Done. Verify output for errors and run tests/verification on a staging DB.

# Supabase Migration Backup

This folder contains a full backup of the SQL migrations for the Flexoraa project. Each file is a copy of the canonical migrations found at `supabase/migrations`. Keep this folder as a snapshot/backups location — do not use it as the source of truth for your regular migration workflow.

Files included

- `20250115000000_add_subscriptions_and_persona.sql` — subscriptions, payments, profile updates
- `20251029000000_meta_api_credentials.sql` — credentials table for Meta API tokens
- `20251114000000_create_company_table.sql` — company table
- `20251114000001_create_team_members_table.sql` — team members table
- `20251114000002_create_appointments_table.sql` — appointments table
- `20251116000000_final_schema_verification.sql` — final schema verification and updates
- `full_migration_backup.sql` — runs the above files sequentially (see notes)

How to apply

1. Always run on a staging copy first. Do not run on production without review.

2. Using the Supabase SQL editor (UI):

   - Open the Supabase dashboard for your project → SQL Editor → paste the file contents and run.

3. Using psql (recommended for CLI):
   - Export a connection string from Supabase (or use your DATABASE_URL) and run:

```powershell
psql "<YOUR_DATABASE_URL>" -f path\to\supabase\migration-backup\full_migration_backup.sql
```

Note: The `full_migration_backup.sql` uses psql's `\i` include directive. If your SQL client does not support `\i`, open each file and run them in order or use the Supabase SQL editor.

4. Using Supabase CLI / `supabase db` workflows:
   - You can execute single files using the `supabase db remote` configuration and a psql command, or run parts via the dashboard.

Verification

- Inspect the Supabase dashboard to ensure tables, policies, and triggers are present.
- Run application integration tests against the staged DB.

If you want me to also create a timestamped copy (ZIP or SQL dump of the entire DB) or add checksums and file verification, tell me and I'll add that next. ✅

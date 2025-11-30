-- Backup: Add Meta API Credentials Table
-- Source: ../migrations/20251029000000_meta_api_credentials.sql

create table if not exists public.credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  business_manager_id text,
  business_account_id text,
  phone_number_id text,
  meta_access_token text not null,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

alter table public.credentials enable row level security;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Users can view own credentials') THEN
        CREATE POLICY "Users can view own credentials" on public.credentials for select using (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Users can insert own credentials') THEN
        CREATE POLICY "Users can insert own credentials" on public.credentials for insert with check (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Users can update own credentials') THEN
        CREATE POLICY "Users can update own credentials" on public.credentials for update using (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Users can delete own credentials') THEN
        CREATE POLICY "Users can delete own credentials" on public.credentials for delete using (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS credentials_user_id_idx on public.credentials(user_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'public.credentials'::regclass) THEN
        CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

select 'credentials backup (copy) — ready' as status;

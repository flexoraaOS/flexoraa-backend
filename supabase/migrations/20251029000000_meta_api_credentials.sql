-- Supabase Migration: Add Meta API Credentials Table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/fgcmqlzhvkjapvlgfxfi/sql

-- Create credentials table for Meta API storage
create table if not exists public.credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  business_manager_id text,
  business_account_id text, -- WABA ID for WhatsApp, Page ID for Instagram/Facebook
  phone_number_id text, -- WhatsApp Phone Number ID
  meta_access_token text not null,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id) -- One set of credentials per user
);

-- Enable Row Level Security
alter table public.credentials enable row level security;

-- Create policies for credentials table (only if they don't exist)
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

-- Create index for better performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS credentials_user_id_idx on public.credentials(user_id);

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'public.credentials'::regclass) THEN
        CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Verify the table setup
select 'credentials table setup completed successfully' as status;

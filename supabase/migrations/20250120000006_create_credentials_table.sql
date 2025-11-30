-- =====================================================
-- FLEXORAA CREDENTIALS TABLE MIGRATION
-- =====================================================
-- Description: Creates the credentials table for Meta API credentials
-- Created: 2025-01-20
-- =====================================================

-- Create credentials table for Meta API storage
CREATE TABLE IF NOT EXISTS public.credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  business_manager_id text,
  business_account_id text, -- WABA ID for WhatsApp, Page ID for Instagram/Facebook
  phone_number_id text, -- WhatsApp Phone Number ID
  meta_access_token text NOT NULL,
  token_expires_at timestamp with time zone,
  instagram_account_id text,
  facebook_page_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credentials' AND column_name = 'user_id') THEN
        ALTER TABLE public.credentials ADD COLUMN user_id uuid REFERENCES auth.users ON DELETE CASCADE;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for credentials table
DROP POLICY IF EXISTS "Users can view own credentials" ON public.credentials;
CREATE POLICY "Users can view own credentials" 
ON public.credentials 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credentials" ON public.credentials;
CREATE POLICY "Users can insert own credentials" 
ON public.credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credentials" ON public.credentials;
CREATE POLICY "Users can update own credentials" 
ON public.credentials 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own credentials" ON public.credentials;
CREATE POLICY "Users can delete own credentials" 
ON public.credentials 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS credentials_user_id_idx ON public.credentials(user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.credentials;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.credentials 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Credentials table setup completed successfully' as status;

-- =====================================================
-- FLEXORAA CAMPAIGNS TABLE MIGRATION
-- =====================================================
-- Description: Creates the campaigns table for marketing campaigns
-- Created: 2025-01-20
-- =====================================================

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns table
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users can view own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
CREATE POLICY "Users can insert own campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can update own campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete own campaigns" 
ON public.campaigns 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.campaigns;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.campaigns 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Campaigns table setup completed successfully' as status;

-- =====================================================
-- FLEXORAA COMPANY TABLE MIGRATION
-- =====================================================
-- Description: Creates the company table for company details
-- Created: 2025-01-20
-- =====================================================

-- Create company table
CREATE TABLE IF NOT EXISTS public.company (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    company_name text NOT NULL,
    company_type text,
    industry text,
    sector text,
    company_size text,
    website text,
    address text,
    city text,
    state text,
    country text,
    postal_code text,
    phone text,
    gst_number text,
    gst_rate text,
    description text,
    logo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add user_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'user_id') THEN
        ALTER TABLE public.company ADD COLUMN user_id uuid REFERENCES auth.users ON DELETE CASCADE;
        -- If the table has data, we might need to set user_id, but for now assume it's empty or handle later
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

-- Create policies for company table
DROP POLICY IF EXISTS "Users can view own company" ON public.company;
CREATE POLICY "Users can view own company" 
ON public.company 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company" ON public.company;
CREATE POLICY "Users can insert own company" 
ON public.company 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company" ON public.company;
CREATE POLICY "Users can update own company" 
ON public.company 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own company" ON public.company;
CREATE POLICY "Users can delete own company" 
ON public.company 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS company_user_id_idx ON public.company(user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.company;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.company 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Company table setup completed successfully' as status;

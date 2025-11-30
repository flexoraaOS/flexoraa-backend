-- Migration: Create Company Table
-- Created: 2025-11-14
-- Description: Creates the company table for storing company details

-- Create company table
CREATE TABLE IF NOT EXISTS public.company (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    company_name text NOT NULL,
    company_type text NOT NULL,
    country text NOT NULL,
    state text,
    gst_number text,
    gst_rate text NOT NULL,
    sector text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

-- Create policies for company table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company' AND policyname = 'Users can view own company details') THEN
        CREATE POLICY "Users can view own company details" ON public.company
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company' AND policyname = 'Users can insert own company details') THEN
        CREATE POLICY "Users can insert own company details" ON public.company
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company' AND policyname = 'Users can update own company details') THEN
        CREATE POLICY "Users can update own company details" ON public.company
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company' AND policyname = 'Users can delete own company details') THEN
        CREATE POLICY "Users can delete own company details" ON public.company
            FOR DELETE USING (auth.uid() = id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS company_user_id_idx ON public.company(id);

-- Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'handle_updated_at'
        AND tgrelid = 'public.company'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at
        BEFORE UPDATE ON public.company
        FOR EACH ROW
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Verify the setup
SELECT 'Company table setup completed successfully' as status;

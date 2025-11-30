-- =====================================================
-- FLEXORAA PUBLIC TABLES MIGRATION
-- =====================================================
-- Description: Creates public tables (contacts, feedback)
-- Created: 2025-01-20
-- =====================================================

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  phone text,
  company text,
  message text,
  source text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts table
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;
CREATE POLICY "Anyone can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view contacts" ON public.contacts;
CREATE POLICY "Anyone can view contacts" 
ON public.contacts 
FOR SELECT 
USING (true);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  feedback text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback table
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;
CREATE POLICY "Anyone can view feedback" 
ON public.feedback 
FOR SELECT 
USING (true);

-- Verify the setup
SELECT 'Public tables (contacts, feedback) setup completed successfully' as status;

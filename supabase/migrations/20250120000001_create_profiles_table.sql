-- =====================================================
-- FLEXORAA PROFILES TABLE MIGRATION
-- =====================================================
-- Description: Creates the profiles table (extends auth.users)
-- Created: 2025-01-20
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  role text DEFAULT 'user'::text CHECK (role IN ('user', 'admin', 'owner', 'sdr')),
  full_name text,
  first_name text,
  last_name text,
  agent_name text,
  agent_persona text,
  business_info text,
  leados_limit integer DEFAULT 2000,
  agentos_limit integer DEFAULT 5000,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Profiles table setup completed successfully' as status;

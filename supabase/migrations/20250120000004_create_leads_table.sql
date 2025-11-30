-- =====================================================
-- FLEXORAA LEADS TABLE MIGRATION
-- =====================================================
-- Description: Creates the leads table for lead management
-- Created: 2025-01-20
-- =====================================================

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text,
  phone_number text NOT NULL,
  email text,
  tags text,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'processed', 'invalid', 'skipped', 'valid')),
  temperature text DEFAULT 'natural'::text CHECK (temperature IN ('hot', 'warm', 'cold', 'natural')),
  campaign_id integer REFERENCES public.campaigns ON DELETE SET NULL,
  metadata jsonb,
  has_whatsapp boolean DEFAULT false,
  conversation_score integer DEFAULT 10,
  followup_date date,
  followup_time time,
  closed boolean DEFAULT false,
  contacted boolean DEFAULT false,
  booked_timestamp timestamp with time zone,
  stage text DEFAULT 'new'::text CHECK (stage IN ('new', 'contacted', 'qualified', 'converted', 'unqualified', 'booked')),
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to existing leads table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'campaign_id') THEN
        ALTER TABLE public.leads ADD COLUMN campaign_id integer REFERENCES public.campaigns ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'metadata') THEN
        ALTER TABLE public.leads ADD COLUMN metadata jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'has_whatsapp') THEN
        ALTER TABLE public.leads ADD COLUMN has_whatsapp boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'conversation_score') THEN
        ALTER TABLE public.leads ADD COLUMN conversation_score integer DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'followup_date') THEN
        ALTER TABLE public.leads ADD COLUMN followup_date date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'followup_time') THEN
        ALTER TABLE public.leads ADD COLUMN followup_time time;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'closed') THEN
        ALTER TABLE public.leads ADD COLUMN closed boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'contacted') THEN
        ALTER TABLE public.leads ADD COLUMN contacted boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'booked_timestamp') THEN
        ALTER TABLE public.leads ADD COLUMN booked_timestamp timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'stage') THEN
        ALTER TABLE public.leads ADD COLUMN stage text DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'converted', 'unqualified', 'booked'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'note') THEN
        ALTER TABLE public.leads ADD COLUMN note text;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
CREATE POLICY "Users can insert own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Users can delete own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_campaign_id_idx ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS leads_phone_number_idx ON public.leads(phone_number);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON public.leads(stage);
CREATE INDEX IF NOT EXISTS leads_temperature_idx ON public.leads(temperature);
CREATE INDEX IF NOT EXISTS leads_contacted_idx ON public.leads(contacted);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.leads;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.leads 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Leads table setup completed successfully' as status;

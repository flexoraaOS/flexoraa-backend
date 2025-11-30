-- =====================================================
-- FLEXORAA APPOINTMENTS TABLE MIGRATION
-- =====================================================
-- Description: Creates the appointments table for scheduling
-- Created: 2025-01-20
-- =====================================================

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    lead_id integer REFERENCES public.leads ON DELETE CASCADE,
    title text DEFAULT 'Appointment',
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status text DEFAULT 'scheduled'::text CHECK (status IN ('scheduled', 'completed', 'canceled', 'cancelled', 'rescheduled', 'no-show', 'no_show')),
    location text,
    meeting_link text,
    timezone text DEFAULT 'UTC',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments table
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments(status);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.appointments;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.appointments 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Appointments table setup completed successfully' as status;

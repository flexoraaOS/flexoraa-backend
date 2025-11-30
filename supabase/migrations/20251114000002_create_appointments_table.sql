-- Migration: Create Appointments Table
-- Created: 2025-11-14
-- Description: Creates the appointments table for managing booked appointments

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    lead_id uuid REFERENCES public.leads ON DELETE CASCADE,
    title text DEFAULT 'Appointment',
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    status text DEFAULT 'scheduled'::text CHECK (status IN ('scheduled', 'completed', 'canceled', 'rescheduled', 'no-show')),
    location text,
    timezone text DEFAULT 'UTC',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can view own appointments') THEN
        CREATE POLICY "Users can view own appointments" ON public.appointments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can insert own appointments') THEN
        CREATE POLICY "Users can insert own appointments" ON public.appointments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can update own appointments') THEN
        CREATE POLICY "Users can update own appointments" ON public.appointments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can delete own appointments') THEN
        CREATE POLICY "Users can delete own appointments" ON public.appointments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments(status);

-- Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'handle_updated_at'
        AND tgrelid = 'public.appointments'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at
        BEFORE UPDATE ON public.appointments
        FOR EACH ROW
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Verify the setup
SELECT 'Appointments table setup completed successfully' as status;
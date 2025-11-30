-- Migration: Create Team Members Table
-- Created: 2025-11-14
-- Description: Creates the team_members table for managing team members

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
    status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    invited_by uuid REFERENCES auth.users ON DELETE SET NULL,
    invited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can view team members they invited') THEN
        CREATE POLICY "Users can view team members they invited" ON public.team_members
            FOR SELECT USING (auth.uid() = invited_by);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can view their own team membership') THEN
        CREATE POLICY "Users can view their own team membership" ON public.team_members
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can insert team members they invite') THEN
        CREATE POLICY "Users can insert team members they invite" ON public.team_members
            FOR INSERT WITH CHECK (auth.uid() = invited_by);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can update team members they invited') THEN
        CREATE POLICY "Users can update team members they invited" ON public.team_members
            FOR UPDATE USING (auth.uid() = invited_by);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can delete team members they invited') THEN
        CREATE POLICY "Users can delete team members they invited" ON public.team_members
            FOR DELETE USING (auth.uid() = invited_by);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_invited_by_idx ON public.team_members(invited_by);
CREATE INDEX IF NOT EXISTS team_members_email_idx ON public.team_members(email);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON public.team_members(status);

-- Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'handle_updated_at'
        AND tgrelid = 'public.team_members'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at
        BEFORE UPDATE ON public.team_members
        FOR EACH ROW
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Verify the setup
SELECT 'Team members table setup completed successfully' as status;

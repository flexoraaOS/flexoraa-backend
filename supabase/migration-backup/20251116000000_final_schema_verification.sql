-- =====================================================
-- FLEXORAA DATABASE SCHEMA VERIFICATION & UPDATES (backup copy)
-- =====================================================
-- This migration ensures all database requirements from the current codebase are met
-- Run this to verify and update the database schema as needed
-- =====================================================

-- Ensure all required tables exist with proper structure

-- 1. Verify and update profiles table
DO $$
BEGIN
	-- Add any missing columns to profiles
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agent_name') THEN
		ALTER TABLE public.profiles ADD COLUMN agent_name text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agent_persona') THEN
		ALTER TABLE public.profiles ADD COLUMN agent_persona text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_info') THEN
		ALTER TABLE public.profiles ADD COLUMN business_info text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'leados_limit') THEN
		ALTER TABLE public.profiles ADD COLUMN leados_limit integer DEFAULT 2000;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agentos_limit') THEN
		ALTER TABLE public.profiles ADD COLUMN agentos_limit integer DEFAULT 5000;
	END IF;

	-- Ensure RLS is enabled
	ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

	-- Ensure policies exist
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
		CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
		CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
		CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
	END IF;
END $$;

-- 2. Verify and update company table
DO $$
BEGIN
	-- Add any missing columns to company
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'industry') THEN
		ALTER TABLE public.company ADD COLUMN industry text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'company_size') THEN
		ALTER TABLE public.company ADD COLUMN company_size text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'website') THEN
		ALTER TABLE public.company ADD COLUMN website text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'address') THEN
		ALTER TABLE public.company ADD COLUMN address text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'city') THEN
		ALTER TABLE public.company ADD COLUMN city text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'state') THEN
		ALTER TABLE public.company ADD COLUMN state text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'country') THEN
		ALTER TABLE public.company ADD COLUMN country text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'postal_code') THEN
		ALTER TABLE public.company ADD COLUMN postal_code text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'phone') THEN
		ALTER TABLE public.company ADD COLUMN phone text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'description') THEN
		ALTER TABLE public.company ADD COLUMN description text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'logo_url') THEN
		ALTER TABLE public.company ADD COLUMN logo_url text;
	END IF;

	-- Ensure RLS is enabled
	ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

	-- Ensure policies exist
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company' AND policyname = 'Users can view own company') THEN
		CREATE POLICY "Users can view own company" ON public.company FOR SELECT USING (auth.uid() = id);
		CREATE POLICY "Users can insert own company" ON public.company FOR INSERT WITH CHECK (auth.uid() = id);
		CREATE POLICY "Users can update own company" ON public.company FOR UPDATE USING (auth.uid() = id);
		CREATE POLICY "Users can delete own company" ON public.company FOR DELETE USING (auth.uid() = id);
	END IF;
END $$;

-- 3. Verify and update leads table
DO $$
BEGIN
	-- Add any missing columns to leads
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name') THEN
		ALTER TABLE public.leads ADD COLUMN name text;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tags') THEN
		ALTER TABLE public.leads ADD COLUMN tags text;
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

	-- Ensure RLS is enabled
	ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

	-- Ensure policies exist
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view own leads') THEN
		CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
		CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);
	END IF;
END $$;

-- 4. Verify and update campaigns table
DO $$
BEGIN
	-- Ensure campaigns table exists and has proper structure
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
		CREATE TABLE public.campaigns (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE,
			name text NOT NULL,
			description text,
			start_date timestamp with time zone,
			end_date timestamp with time zone,
			status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
		CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

		CREATE INDEX campaigns_user_id_idx ON public.campaigns(user_id);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.campaigns
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 5. Verify and update contact_history table
DO $$
BEGIN
	-- Ensure contact_history table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_history') THEN
		CREATE TABLE public.contact_history (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
			campaign_id uuid REFERENCES public.campaigns ON DELETE CASCADE,
			lead_id uuid REFERENCES public.leads ON DELETE CASCADE NOT NULL,
			direction text,
			message_text text,
			message_type text,
			sent_at timestamp with time zone DEFAULT timezone('utc'::text, now())
		);

		ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own contact history" ON public.contact_history FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own contact history" ON public.contact_history FOR INSERT WITH CHECK (auth.uid() = user_id);

		CREATE INDEX contact_history_user_id_idx ON public.contact_history(user_id);
		CREATE INDEX contact_history_lead_id_idx ON public.contact_history(lead_id);
		CREATE INDEX contact_history_campaign_id_idx ON public.contact_history(campaign_id);
	END IF;
END $$;

-- 6. Verify and update credentials table
DO $$
BEGIN
	-- Ensure credentials table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credentials') THEN
		CREATE TABLE public.credentials (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
			business_manager_id text,
			business_account_id text,
			phone_number_id text,
			meta_access_token text NOT NULL,
			token_expires_at timestamp with time zone,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			UNIQUE(user_id)
		);

		ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own credentials" ON public.credentials FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own credentials" ON public.credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own credentials" ON public.credentials FOR UPDATE USING (auth.uid() = user_id);
		CREATE POLICY "Users can delete own credentials" ON public.credentials FOR DELETE USING (auth.uid() = user_id);

		CREATE INDEX credentials_user_id_idx ON public.credentials(user_id);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.credentials
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 7. Verify and update team_members table
DO $$
BEGIN
	-- Ensure team_members table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
		CREATE TABLE public.team_members (
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

		ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view team members they invited" ON public.team_members FOR SELECT USING (auth.uid() = invited_by);
		CREATE POLICY "Users can view their own team membership" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert team members they invite" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = invited_by);
		CREATE POLICY "Users can update team members they invited" ON public.team_members FOR UPDATE USING (auth.uid() = invited_by);
		CREATE POLICY "Users can delete team members they invited" ON public.team_members FOR DELETE USING (auth.uid() = invited_by);

		CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
		CREATE INDEX team_members_invited_by_idx ON public.team_members(invited_by);
		CREATE INDEX team_members_email_idx ON public.team_members(email);
		CREATE INDEX team_members_status_idx ON public.team_members(status);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.team_members
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 8. Verify and update appointments table
DO $$
BEGIN
	-- Ensure appointments table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
		CREATE TABLE public.appointments (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
			lead_id uuid REFERENCES public.leads ON DELETE CASCADE,
			title text NOT NULL,
			description text,
			scheduled_at timestamp with time zone NOT NULL,
			duration_minutes integer DEFAULT 30,
			status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
			meeting_link text,
			notes text,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
		CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

		CREATE INDEX appointments_user_id_idx ON public.appointments(user_id);
		CREATE INDEX appointments_lead_id_idx ON public.appointments(lead_id);
		CREATE INDEX appointments_scheduled_at_idx ON public.appointments(scheduled_at);
		CREATE INDEX appointments_status_idx ON public.appointments(status);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.appointments
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 9. Verify and update subscriptions table
DO $$
BEGIN
	-- Ensure subscriptions table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
		CREATE TABLE public.subscriptions (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
			plan_name text NOT NULL,
			status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
			current_period_start timestamp with time zone NOT NULL,
			current_period_end timestamp with time zone NOT NULL,
			razorpay_payment_id text,
			razorpay_order_id text,
			razorpay_subscription_id text,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
		CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

		CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
		CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.subscriptions
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 10. Verify and update payments table
DO $$
BEGIN
	-- Ensure payments table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
		CREATE TABLE public.payments (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
			order_id text NOT NULL,
			payment_id text NOT NULL UNIQUE,
			signature text,
			amount integer NOT NULL,
			status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
			invoice_url text,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
			updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
		CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
		CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);

		CREATE INDEX payments_user_id_idx ON public.payments(user_id);
		CREATE INDEX payments_payment_id_idx ON public.payments(payment_id);
		CREATE INDEX payments_status_idx ON public.payments(status);

		CREATE TRIGGER handle_updated_at
		BEFORE UPDATE ON public.payments
		FOR EACH ROW
		EXECUTE PROCEDURE public.handle_updated_at();
	END IF;
END $$;

-- 11. Verify public tables (contacts and feedback)
DO $$
BEGIN
	-- Ensure contacts table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
		CREATE TABLE public.contacts (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			name text,
			email text,
			message text,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);
		CREATE POLICY "Anyone can view contacts" ON public.contacts FOR SELECT USING (true);
	END IF;

	-- Ensure feedback table exists
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
		CREATE TABLE public.feedback (
			id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
			name text NOT NULL,
			email text NOT NULL,
			feedback text NOT NULL,
			created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
		);

		ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

		CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
		CREATE POLICY "Anyone can view feedback" ON public.feedback FOR SELECT USING (true);
	END IF;
END $$;

-- 12. Verify storage buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- 13. Ensure storage policies exist
DO $$
BEGIN
	-- Avatar policies
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar images are publicly accessible') THEN
		CREATE POLICY "Avatar images are publicly accessible"
		ON storage.objects FOR SELECT
		USING (bucket_id = 'avatars');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatar') THEN
		CREATE POLICY "Users can upload their own avatar"
		ON storage.objects FOR INSERT
		WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
	END IF;

	-- Company logo policies
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company logos are publicly accessible') THEN
		CREATE POLICY "Company logos are publicly accessible"
		ON storage.objects FOR SELECT
		USING (bucket_id = 'company-logos');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload company logos') THEN
		CREATE POLICY "Users can upload company logos"
		ON storage.objects FOR INSERT
		WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
	END IF;

	-- Invoice policies
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view own invoices') THEN
		CREATE POLICY "Users can view own invoices"
		ON storage.objects FOR SELECT
		USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own invoices') THEN
		CREATE POLICY "Users can upload own invoices"
		ON storage.objects FOR INSERT
		WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
	END IF;
END $$;

-- 14. Final verification report
SELECT
	'Database schema verification completed!' as status,
	(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
	(SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
	(SELECT COUNT(*) FROM storage.buckets) as total_buckets,
	NOW() as verification_timestamp;

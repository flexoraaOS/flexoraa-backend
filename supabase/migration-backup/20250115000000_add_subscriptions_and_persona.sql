-- Backup: Add Subscriptions Table and AI Persona Fields
-- Source: ../migrations/20250115000000_add_subscriptions_and_persona.sql

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    plan_name text NOT NULL,
    status text DEFAULT 'active'::text CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    razorpay_payment_id text,
    razorpay_order_id text,
    razorpay_subscription_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Recreate policies (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions') THEN
        CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can insert own subscriptions') THEN
        CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions 
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can update own subscriptions') THEN
        CREATE POLICY "Users can update own subscriptions" ON public.subscriptions 
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can delete own subscriptions') THEN
        CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions 
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- Trigger for updated_at (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at' 
        AND tgrelid = 'public.subscriptions'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at 
        BEFORE UPDATE ON public.subscriptions 
        FOR EACH ROW 
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Add AI persona & usage-limit fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS agent_name text,
ADD COLUMN IF NOT EXISTS agent_persona text,
ADD COLUMN IF NOT EXISTS business_info text;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS leados_limit integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS agentos_limit integer DEFAULT 5000;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    order_id text NOT NULL,
    payment_id text NOT NULL UNIQUE,
    signature text,
    amount integer NOT NULL,
    status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'success', 'failed')),
    invoice_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments') THEN
        CREATE POLICY "Users can view own payments" ON public.payments 
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments') THEN
        CREATE POLICY "Users can insert own payments" ON public.payments 
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update own payments') THEN
        CREATE POLICY "Users can update own payments" ON public.payments 
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_payment_id_idx ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at' 
        AND tgrelid = 'public.payments'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at 
        BEFORE UPDATE ON public.payments 
        FOR EACH ROW 
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

SELECT 'Subscriptions and payments backup (copy) — ready' as status;

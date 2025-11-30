-- Migration: Add Subscriptions Table and AI Persona Fields
-- Created: 2025-01-15
-- Description: Adds subscriptions table and AI persona fields to profiles table

-- ============================================================
-- STEP 1: Create Updated_at Handler Function (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create policies for subscriptions table
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- Create trigger for updated_at
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

-- Add AI persona fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS agent_name text,
ADD COLUMN IF NOT EXISTS agent_persona text,
ADD COLUMN IF NOT EXISTS business_info text;

-- Add usage limit fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS leados_limit integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS agentos_limit integer DEFAULT 5000;

-- Add first_name and last_name to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create payments table if it doesn't exist (should already exist from verify-payment route)
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

-- Enable Row Level Security for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
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

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_payment_id_idx ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- Create trigger for payments updated_at
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

-- Verify the setup
SELECT 'Subscriptions and payments tables setup completed successfully' as status;

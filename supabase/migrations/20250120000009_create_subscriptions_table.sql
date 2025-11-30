-- =====================================================
-- FLEXORAA SUBSCRIPTIONS TABLE MIGRATION
-- =====================================================
-- Description: Creates the subscriptions table for subscription management
-- Created: 2025-01-20
-- =====================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    plan_name text NOT NULL,
    plan_type text CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
    status text DEFAULT 'active'::text CHECK (status IN ('active', 'cancelled', 'expired', 'paused', 'trial')),
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    razorpay_payment_id text,
    razorpay_order_id text,
    razorpay_subscription_id text,
    amount integer,
    currency text DEFAULT 'INR',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to existing subscriptions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_type text CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'cancel_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN cancel_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'canceled_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN canceled_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_start timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'amount') THEN
        ALTER TABLE public.subscriptions ADD COLUMN amount integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'currency') THEN
        ALTER TABLE public.subscriptions ADD COLUMN currency text DEFAULT 'INR';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete own subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_type_idx ON public.subscriptions(plan_type);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.subscriptions;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.subscriptions 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Subscriptions table setup completed successfully' as status;

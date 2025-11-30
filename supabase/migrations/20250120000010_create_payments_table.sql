-- =====================================================
-- FLEXORAA PAYMENTS TABLE MIGRATION
-- =====================================================
-- Description: Creates the payments table for payment tracking
-- Created: 2025-01-20
-- =====================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    order_id text NOT NULL,
    payment_id text NOT NULL UNIQUE,
    signature text,
    amount integer NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method text,
    invoice_url text,
    invoice_number text,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments" 
ON public.payments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_payment_id_idx ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.payments;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.payments 
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_updated_at();

-- Verify the setup
SELECT 'Payments table setup completed successfully' as status;

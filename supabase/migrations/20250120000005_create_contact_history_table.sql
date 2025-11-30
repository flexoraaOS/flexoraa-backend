-- =====================================================
-- FLEXORAA CONTACT HISTORY TABLE MIGRATION
-- =====================================================
-- Description: Creates the contact_history table for tracking communications
-- Created: 2025-01-20
-- =====================================================

-- Create contact_history table
CREATE TABLE IF NOT EXISTS public.contact_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads ON DELETE CASCADE NOT NULL,
  direction text CHECK (direction IN ('inbound', 'outbound')),
  message_text text,
  message_type text CHECK (message_type IN ('whatsapp', 'instagram', 'messenger', 'email', 'sms', 'call')),
  platform text CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'email', 'sms', 'call')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata jsonb,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_history table
DROP POLICY IF EXISTS "Users can view own contact history" ON public.contact_history;
CREATE POLICY "Users can view own contact history" 
ON public.contact_history 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contact history" ON public.contact_history;
CREATE POLICY "Users can insert own contact history" 
ON public.contact_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contact_history_user_id_idx ON public.contact_history(user_id);
CREATE INDEX IF NOT EXISTS contact_history_lead_id_idx ON public.contact_history(lead_id);
CREATE INDEX IF NOT EXISTS contact_history_campaign_id_idx ON public.contact_history(campaign_id);
CREATE INDEX IF NOT EXISTS contact_history_sent_at_idx ON public.contact_history(sent_at);
CREATE INDEX IF NOT EXISTS contact_history_message_type_idx ON public.contact_history(message_type);

-- Verify the setup
SELECT 'Contact history table setup completed successfully' as status;

-- =====================================================
-- FLEXORAA MESSAGES TABLE MIGRATION
-- =====================================================
-- Description: Creates the messages table for internal messaging
-- Created: 2025-01-20
-- =====================================================

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
DROP POLICY IF EXISTS "Users can view messages sent by or to them" ON public.messages;
CREATE POLICY "Users can view messages sent by or to them"
  ON public.messages 
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages sent by them" ON public.messages;
CREATE POLICY "Users can insert messages sent by them"
  ON public.messages 
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update read status of messages received by them" ON public.messages;
CREATE POLICY "Users can update read status of messages received by them"
  ON public.messages 
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Verify the setup
SELECT 'Messages table setup completed successfully' as status;

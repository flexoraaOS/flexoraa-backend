-- Migration: Create n8n_chat_histories table
-- Implements Postgres Chat Memory for AI sessions

CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by phone_number
CREATE INDEX IF NOT EXISTS idx_chat_histories_phone 
ON n8n_chat_histories(phone_number, created_at DESC);

-- Optional: Add TTL cleanup (delete messages older than 30 days)
CREATE INDEX IF NOT EXISTS idx_chat_histories_cleanup
ON n8n_chat_histories(created_at) 
WHERE created_at < (NOW() - INTERVAL '30 days');

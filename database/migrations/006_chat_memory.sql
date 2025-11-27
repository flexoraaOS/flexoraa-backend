-- Migration 006: Chat Memory (Postgres-backed for AI conversations)
-- Stores conversation history for AI agents with session management
-- Version: 1.0.0
-- Date: 2025-11-28

CREATE TABLE IF NOT EXISTS chat_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id VARCHAR(255) NOT NULL, -- typically phone number or user_id
  role VARCHAR(50) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  token_count INTEGER, -- for cost tracking
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chat_memory_tenant ON chat_memory(tenant_id);
CREATE INDEX idx_chat_memory_session ON chat_memory(session_id);
CREATE INDEX idx_chat_memory_session_created ON chat_memory(session_id, created_at DESC);
CREATE INDEX idx_chat_memory_created ON chat_memory(created_at DESC);

-- Function to get recent chat history for a session
CREATE OR REPLACE FUNCTION get_chat_history(
  p_session_id VARCHAR,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  role VARCHAR,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.role, cm.content, cm.created_at
  FROM chat_memory cm
  WHERE cm.session_id = p_session_id
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to add message to chat memory
CREATE OR REPLACE FUNCTION add_chat_message(
  p_tenant_id UUID,
  p_session_id VARCHAR,
  p_role VARCHAR,
  p_content TEXT,
  p_token_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO chat_memory (tenant_id, session_id, role, content, token_count, metadata)
  VALUES (p_tenant_id, p_session_id, p_role, p_content, p_token_count, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old chat history (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_chat_memory(
  p_days_to_retain INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM chat_memory
    WHERE created_at < NOW() - (p_days_to_retain || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- View for token usage by session (cost tracking)
CREATE OR REPLACE VIEW chat_token_usage AS
SELECT 
  tenant_id,
  session_id,
  COUNT(*) as message_count,
  SUM(token_count) as total_tokens,
  MAX(created_at) as last_interaction
FROM chat_memory
WHERE token_count IS NOT NULL
GROUP BY tenant_id, session_id;

-- Enable RLS
ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE chat_memory IS 'Postgres-backed chat conversation history for AI agents';
COMMENT ON COLUMN chat_memory.session_id IS 'Session identifier (phone number, user_id, or custom key)';
COMMENT ON COLUMN chat_memory.token_count IS 'Number of tokens for cost tracking';
COMMENT ON FUNCTION get_chat_history IS 'Retrieves recent chat messages for a session';
COMMENT ON FUNCTION add_chat_message IS 'Adds a new message to chat memory';
COMMENT ON FUNCTION cleanup_old_chat_memory IS 'Deletes chat history older than specified days';
COMMENT ON VIEW chat_token_usage IS 'Token usage summary per session for cost analysis';

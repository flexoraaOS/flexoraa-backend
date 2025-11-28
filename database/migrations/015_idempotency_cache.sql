-- Migration: Create idempotency_cache table with DB fallback support
-- Supports persistent idempotency when Redis unavailable

CREATE TABLE IF NOT EXISTS idempotency_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  response_headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for fast lookups by key
CREATE INDEX IF NOT EXISTS idx_idempotency_cache_key 
ON idempotency_cache(key) WHERE expires_at > NOW();

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_idempotency_cache_expires 
ON idempotency_cache(expires_at);

-- Auto-cleanup expired entries (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE idempotency_cache IS 'Persistent fallback for idempotency when Redis unavailable';
COMMENT ON COLUMN idempotency_cache.key IS 'Idempotency key from X-Idempotency-Key header';
COMMENT ON COLUMN idempotency_cache.expires_at IS 'TTL for this cache entry (default 30 days)';

-- Migration 004: Webhook Raw (with Nonce Storage for Replay Prevention)
-- Stores raw webhook payloads with signature verification and replay prevention
-- Version: 1.0.0
-- Date: 2025-11-28

CREATE TABLE IF NOT EXISTS webhook_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  source VARCHAR(50) NOT NULL, -- whatsapp, klicktipp, twilio, custom
  request_id VARCHAR(255) UNIQUE NOT NULL, -- X-Request-Id header for idempotency
  nonce VARCHAR(255), -- for replay attack prevention
  signature VARCHAR(512), -- webhook signature for verification
  signature_verified BOOLEAN DEFAULT FALSE,
  timestamp_received TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  timestamp_header TIMESTAMP WITH TIME ZONE, -- timestamp from webhook provider
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  body JSONB, -- webhook payload
  raw_body TEXT, -- raw body for signature verification
  ip_address INET,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL -- auto-cleanup after 7 days
);

CREATE INDEX idx_webhook_raw_tenant ON webhook_raw(tenant_id);
CREATE INDEX idx_webhook_raw_source ON webhook_raw(source);
CREATE INDEX idx_webhook_raw_request_id ON webhook_raw(request_id);
CREATE INDEX idx_webhook_raw_nonce ON webhook_raw(nonce) WHERE nonce IS NOT NULL;
CREATE INDEX idx_webhook_raw_timestamp ON webhook_raw(timestamp_received DESC);
CREATE INDEX idx_webhook_raw_processed ON webhook_raw(processed) WHERE NOT processed;
CREATE INDEX idx_webhook_raw_expires ON webhook_raw(expires_at);

-- Function to check for duplicate request (idempotency)
CREATE OR REPLACE FUNCTION check_duplicate_webhook_request(
  p_request_id VARCHAR,
  p_nonce VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM webhook_raw
    WHERE request_id = p_request_id
       OR (p_nonce IS NOT NULL AND nonce = p_nonce)
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired webhooks (for scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_webhooks()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM webhook_raw
    WHERE expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE webhook_raw ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE webhook_raw IS 'Raw webhook storage with replay prevention and idempotency';
COMMENT ON COLUMN webhook_raw.request_id IS 'X-Request-Id header for idempotency deduplication';
COMMENT ON COLUMN webhook_raw.nonce IS 'Nonce for replay attack prevention';
COMMENT ON COLUMN webhook_raw.expires_at IS 'Auto-cleanup after 7 days (configurable)';
COMMENT ON FUNCTION check_duplicate_webhook_request IS 'Returns TRUE if request_id or nonce already exists';
COMMENT ON FUNCTION cleanup_expired_webhooks IS 'Deletes webhooks past their expiration date';

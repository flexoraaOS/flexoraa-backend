-- Migration 002: Consent Log (IMMUTABLE, APPEND-ONLY)
-- GDPR/Compliance: tracks all consent events, encrypted payload
-- Version: 1.0.0
-- Date: 2025-11-28

-- Consent log table (APPEND-ONLY, NO UPDATES/DELETES ALLOWED)
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL, -- encrypted at application layer
  email VARCHAR(255), -- encrypted at application layer
  consent_type VARCHAR(50) NOT NULL, -- whatsapp_optin, whatsapp_optout, sms_optin, voice_optin, etc.
  consent_status VARCHAR(50) NOT NULL, -- granted, revoked
  consent_method VARCHAR(100) NOT NULL, -- webhook, api, manual_entry, whatsapp_stop_keyword
  ip_address INET, -- for audit trail
  user_agent TEXT,
  raw_payload_encrypted BYTEA, -- KMS-encrypted raw webhook/request payload
  kms_key_id VARCHAR(255), -- AWS KMS key ID used for encryption
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL -- who recorded this (NULL for automated)
);

-- Indexes for fast lookups
CREATE INDEX idx_consent_log_tenant ON consent_log(tenant_id);
CREATE INDEX idx_consent_log_phone ON consent_log(phone_number);
CREATE INDEX idx_consent_log_email ON consent_log(email);
CREATE INDEX idx_consent_log_type ON consent_log(consent_type);
CREATE INDEX idx_consent_log_status ON consent_log(consent_status);
CREATE INDEX idx_consent_log_created ON consent_log(created_at DESC);

-- CRITICAL: Prevent UPDATE and DELETE operations
-- This ensures consent_log is truly append-only
CREATE OR REPLACE FUNCTION prevent_consent_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'consent_log is append-only: UPDATE and DELETE operations are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_consent_log_update
  BEFORE UPDATE ON consent_log
  FOR EACH ROW EXECUTE FUNCTION prevent_consent_log_modification();

CREATE TRIGGER prevent_consent_log_delete
  BEFORE DELETE ON consent_log
  FOR EACH ROW EXECUTE FUNCTION prevent_consent_log_modification();

-- Function to get latest consent status for a phone/email
CREATE OR REPLACE FUNCTION get_latest_consent(
  p_phone_number VARCHAR DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL,
  p_consent_type VARCHAR DEFAULT 'whatsapp_optin'
)
RETURNS TABLE (
  consent_status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT cl.consent_status, cl.created_at
  FROM consent_log cl
  WHERE 
    (p_phone_number IS NOT NULL AND cl.phone_number = p_phone_number)
    OR (p_email IS NOT NULL AND cl.email = p_email)
    AND cl.consent_type = p_consent_type
  ORDER BY cl.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- View for current consent status (latest per contact/type)
CREATE OR REPLACE VIEW current_consent_status AS
SELECT DISTINCT ON (phone_number, email, consent_type)
  id,
  tenant_id,
  phone_number,
  email,
  consent_type,
  consent_status,
  consent_method,
  created_at
FROM consent_log
ORDER BY phone_number, email, consent_type, created_at DESC;

-- Enable RLS
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE consent_log IS 'Immutable append-only consent tracking for GDPR compliance';
COMMENT ON COLUMN consent_log.raw_payload_encrypted IS 'KMS-encrypted original webhook/request payload';
COMMENT ON FUNCTION prevent_consent_log_modification() IS 'Enforces append-only: blocks UPDATE/DELETE';
COMMENT ON VIEW current_consent_status IS 'Latest consent status per contact (phone/email) and type';

-- Migration: Immutable Audit Logs
-- Description: Append-only log for compliance (India IT Act / WhatsApp)

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id UUID, -- User ID or System ID
    event_type VARCHAR(100) NOT NULL, -- 'lead_created', 'token_deducted', 'data_exported'
    resource_id UUID, -- ID of the affected resource (lead_id, etc.)
    metadata JSONB DEFAULT '{}', -- Context (IP, User Agent, Diff)
    hash VARCHAR(64), -- SHA-256 hash of the record for tamper-evidence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Prevent Updates/Deletes (Immutability)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_audit_update
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modification();

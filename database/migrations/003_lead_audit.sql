-- Migration 003: Lead Audit Trail
-- Tracks all changes to leads for compliance and debugging
-- Version: 1.0.0
-- Date: 2025-11-28

CREATE TABLE IF NOT EXISTS lead_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- created, status_changed, assigned, score_updated, tag_added, etc.
  actor_type VARCHAR(50) NOT NULL, -- user, system, ai_agent, webhook
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for system/automated
  field_name VARCHAR(100), -- field that changed (e.g., 'status', 'assigned_to')
  old_value TEXT, -- previous value (JSON if object)
  new_value TEXT, -- new value (JSON if object)
  metadata JSONB DEFAULT '{}'::jsonb, -- additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_lead_audit_lead ON lead_audit(lead_id);
CREATE INDEX idx_lead_audit_tenant ON lead_audit(tenant_id);
CREATE INDEX idx_lead_audit_action ON lead_audit(action);
CREATE INDEX idx_lead_audit_actor ON lead_audit(actor_id);
CREATE INDEX idx_lead_audit_created ON lead_audit(created_at DESC);

-- Trigger to automatically log lead changes
CREATE OR REPLACE FUNCTION log_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_actor_type VARCHAR(50);
BEGIN
  -- Get actor from session variable (set by application)
  v_actor_id := current_setting('app.current_user_id', true)::UUID;
  v_actor_type := COALESCE(current_setting('app.current_actor_type', true), 'system');

  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO lead_audit (lead_id, tenant_id, action, actor_type, actor_id, field_name, old_value, new_value)
    VALUES (NEW.id, NEW.tenant_id, 'status_changed', v_actor_type, v_actor_id, 'status', OLD.status, NEW.status);
  END IF;

  -- Log assignment changes  
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO lead_audit (lead_id, tenant_id, action, actor_type, actor_id, field_name, old_value, new_value)
    VALUES (NEW.id, NEW.tenant_id, 'assigned', v_actor_type, v_actor_id, 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT);
  END IF;

  -- Log score changes
  IF (TG_OP = 'UPDATE' AND (OLD.lead_score IS DISTINCT FROM NEW.lead_score OR OLD.lead_score_ai IS DISTINCT FROM NEW.lead_score_ai)) THEN
    INSERT INTO lead_audit (lead_id, tenant_id, action, actor_type, actor_id, field_name, old_value, new_value, metadata)
    VALUES (NEW.id, NEW.tenant_id, 'score_updated', v_actor_type, v_actor_id, 'lead_score', 
            jsonb_build_object('score', OLD.lead_score, 'ai_score', OLD.lead_score_ai)::TEXT,
            jsonb_build_object('score', NEW.lead_score, 'ai_score', NEW.lead_score_ai)::TEXT,
            NEW.lead_score_explain);
  END IF;

  -- Log lead creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_audit (lead_id, tenant_id, action, actor_type, actor_id, field_name, new_value)
    VALUES (NEW.id, NEW.tenant_id, 'created', v_actor_type, v_actor_id, NULL, 
            jsonb_build_object('phone', NEW.phone_number, 'campaign_id', NEW.campaign_id)::TEXT);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_audit_trigger
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_changes();

-- Enable RLS
ALTER TABLE lead_audit ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE lead_audit IS 'Audit trail for all lead changes (status, assignment, scoring)';
COMMENT ON FUNCTION log_lead_changes() IS 'Automatically logs lead changes to audit table';

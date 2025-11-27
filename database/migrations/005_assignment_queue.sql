-- Migration 005: Assignment Queue (Transactional with Optimistic Locking)
-- Manages SDR assignment queue with fairness and retry logic
-- Version: 1.0.0
-- Date: 2025-11-28

CREATE TABLE IF NOT EXISTS assignment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- SDR user_id
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, assigned, accepted, rejected, expired
  priority INTEGER NOT NULL DEFAULT 0, -- higher = more urgent
  booking_link_token VARCHAR(512), -- HMAC-signed token for booking acceptance
  booking_link_expires_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_channel VARCHAR(50), -- slack, email, webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL, -- for optimistic locking
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_assignment_queue_tenant ON assignment_queue(tenant_id);
CREATE INDEX idx_assignment_queue_lead ON assignment_queue(lead_id);
CREATE INDEX idx_assignment_queue_assigned_to ON assignment_queue(assigned_to);
CREATE INDEX idx_assignment_queue_status ON assignment_queue(status);
CREATE INDEX idx_assignment_queue_priority ON assignment_queue(priority DESC);
CREATE INDEX idx_assignment_queue_created ON assignment_queue(created_at DESC);
CREATE INDEX idx_assignment_queue_pending ON assignment_queue(status) WHERE status = 'pending';

-- Optimistic locking trigger
CREATE OR REPLACE FUNCTION increment_assignment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_queue_version_trigger
  BEFORE UPDATE ON assignment_queue
  FOR EACH ROW EXECUTE FUNCTION increment_assignment_version();

-- Function to assign next lead to SDR (with optimistic locking)
CREATE OR REPLACE FUNCTION assign_next_lead_to_sdr(
  p_sdr_user_id UUID,
  p_tenant_id UUID,
  expected_version INTEGER DEFAULT NULL
)
RETURNS TABLE (
  assignment_id UUID,
  lead_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_assignment RECORD;
  v_updated INTEGER;
BEGIN
  -- Select next pending assignment with highest priority
  SELECT * INTO v_assignment
  FROM assignment_queue
  WHERE tenant_id = p_tenant_id
    AND status = 'pending'
    AND (assigned_to IS NULL OR assigned_to = p_sdr_user_id)
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED; -- prevent race conditions

 IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'No pending assignments available';
    RETURN;
  END IF;

  -- Update with optimistic locking
  UPDATE assignment_queue
  SET 
    assigned_to = p_sdr_user_id,
    status = 'assigned',
    assigned_at = NOW()
  WHERE id = v_assignment.id
    AND (expected_version IS NULL OR version = expected_version)
  RETURNING * INTO STRICT v_assignment;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN QUERY SELECT v_assignment.id, v_assignment.lead_id, FALSE, 'Version conflict - record was modified';
    RETURN;
  END IF;

  -- Update lead assignment
  UPDATE leads
  SET assigned_to = p_sdr_user_id, assigned_at = NOW()
  WHERE id = v_assignment.lead_id;

  RETURN QUERY SELECT v_assignment.id, v_assignment.lead_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to requeue failed/rejected assignments
CREATE OR REPLACE FUNCTION requeue_assignment(
  p_assignment_id UUID,
  p_reason VARCHAR DEFAULT 'retry'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  SELECT * INTO v_assignment
  FROM assignment_queue
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_assignment.retry_count >= v_assignment.max_retries THEN
    UPDATE assignment_queue
    SET status = 'expired', expired_at = NOW()
    WHERE id = p_assignment_id;
    RETURN FALSE;
  END IF;

  UPDATE assignment_queue
  SET 
    status = 'pending',
    assigned_to = NULL,
    retry_count = retry_count + 1,
    notification_sent = FALSE,
    metadata = metadata || jsonb_build_object('requeue_reason', p_reason, 'requeued_at', NOW())
  WHERE id = p_assignment_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE assignment_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE assignment_queue IS 'Transactional SDR assignment queue with optimistic locking';
COMMENT ON COLUMN assignment_queue.version IS 'Optimistic locking version number';
COMMENT ON COLUMN assignment_queue.booking_link_token IS 'HMAC-signed token for booking link validation';
COMMENT ON FUNCTION assign_next_lead_to_sdr IS 'Assigns next pending lead to SDR with concurrency control';
COMMENT ON FUNCTION requeue_assignment IS 'Requeues failed assignment up to max_retries limit';

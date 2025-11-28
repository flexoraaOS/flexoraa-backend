-- Migration 008: Assignment Queue Optimistic Locking
-- Add version column for optimistic locking to prevent race conditions

ALTER TABLE assignment_queue ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create index for faster processing
CREATE INDEX IF NOT EXISTS idx_assignment_queue_status_priority ON assignment_queue(status, priority DESC);

-- Add booking_links table for HMAC-signed tokens
CREATE TABLE IF NOT EXISTS booking_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_booking_links_token ON booking_links(token);
CREATE INDEX IF NOT EXISTS idx_booking_links_lead ON booking_links(lead_id);

-- Create lead_audit table for comprehensive tracking (append-only)
CREATE TABLE IF NOT EXISTS lead_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'scored', 'assigned', 'booked'
    changes JSONB, -- Before/after values
    actor VARCHAR(255), -- User email or 'system'
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_audit_lead_id ON lead_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_audit_created_at ON lead_audit(created_at DESC);

-- Update assignment queue function to use optimistic locking
CREATE OR REPLACE FUNCTION assign_next_lead_to_sdr_v2(p_sdr_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    assignment_id UUID,
    lead_id UUID,
    error_message TEXT,
    version_conflict BOOLEAN
) AS $$
DECLARE
    v_assignment_id UUID;
    v_lead_id UUID;
    v_current_version INTEGER;
BEGIN
    -- Find next pending assignment with highest priority
    SELECT id, lead_id, version
    INTO v_assignment_id, v_lead_id, v_current_version
    FROM assignment_queue
    WHERE tenant_id = p_tenant_id
      AND status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Skip locked rows to prevent contention

    IF v_assignment_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'No pending assignments'::TEXT, false;
        RETURN;
    END IF;

    -- Optimistic locking check and update
    UPDATE assignment_queue
    SET 
        status = 'assigned',
        assigned_to = p_sdr_user_id,
        assigned_at = CURRENT_TIMESTAMP,
        version = version + 1
    WHERE id = v_assignment_id
      AND version = v_current_version -- Optimistic lock check
    RETURNING id INTO v_assignment_id;

    IF v_assignment_id IS NULL THEN
        -- Version conflict - someone else grabbed it
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Assignment already taken'::TEXT, true;
        RETURN;
    END IF;

    -- Update lead status
    UPDATE leads
    SET assigned_sdr = p_sdr_user_id
    WHERE id = v_lead_id;

    RETURN QUERY SELECT true, v_assignment_id, v_lead_id, NULL::TEXT, false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE booking_links IS 'HMAC-signed booking tokens for lead acceptance';
COMMENT ON TABLE lead_audit IS 'Append-only audit trail for all lead operations';
COMMENT ON COLUMN assignment_queue.version IS 'Optimistic locking version for concurrent assignment processing';

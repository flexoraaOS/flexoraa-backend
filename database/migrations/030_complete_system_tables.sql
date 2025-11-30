-- Migration 030: Complete System Tables (100% PRD Implementation)
-- A/B Testing, GDPR, Model Drift, Calendly Integration

-- ============================================
-- A/B TESTING FRAMEWORK
-- ============================================

-- A/B Experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    variants JSONB NOT NULL, -- Array of variant configs
    target_metric VARCHAR(100) NOT NULL, -- conversion_rate, response_rate, etc.
    sample_size INTEGER NOT NULL DEFAULT 1050,
    duration_days INTEGER NOT NULL DEFAULT 14,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, stopped, completed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    stop_reason VARCHAR(100),
    stop_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ab_experiments_tenant ON ab_experiments(tenant_id);
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);

-- A/B Variant Assignments
CREATE TABLE IF NOT EXISTS ab_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(experiment_id, lead_id)
);

CREATE INDEX idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_lead ON ab_assignments(lead_id);
CREATE INDEX idx_ab_assignments_variant ON ab_assignments(variant_id);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ab_results_experiment ON ab_results(experiment_id);
CREATE INDEX idx_ab_results_metric ON ab_results(metric);
CREATE INDEX idx_ab_results_recorded ON ab_results(recorded_at);

-- ============================================
-- GDPR COMPLIANCE
-- ============================================

-- GDPR Deletion Requests
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    requestor_email VARCHAR(255) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected, completed
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gdpr_requests_lead ON gdpr_deletion_requests(lead_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_deletion_requests(status);
CREATE INDEX idx_gdpr_requests_requested ON gdpr_deletion_requests(requested_at);

-- ============================================
-- MODEL DRIFT MONITORING
-- ============================================

-- Model Predictions (for drift tracking)
CREATE TABLE IF NOT EXISTS model_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    prediction_type VARCHAR(100) NOT NULL, -- intent, budget, timeline, score
    predicted_value TEXT NOT NULL,
    confidence DECIMAL(5, 4),
    actual_value TEXT, -- Ground truth (set later)
    metadata JSONB DEFAULT '{}'::jsonb,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_model_predictions_lead ON model_predictions(lead_id);
CREATE INDEX idx_model_predictions_type ON model_predictions(prediction_type);
CREATE INDEX idx_model_predictions_version ON model_predictions(model_version);
CREATE INDEX idx_model_predictions_predicted ON model_predictions(predicted_at);

-- Model Drift Reports
CREATE TABLE IF NOT EXISTS model_drift_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version VARCHAR(50) NOT NULL,
    has_drift BOOLEAN NOT NULL DEFAULT FALSE,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    baseline_metrics JSONB NOT NULL,
    current_metrics JSONB NOT NULL,
    drift_details JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drift_reports_version ON model_drift_reports(model_version);
CREATE INDEX idx_drift_reports_detected ON model_drift_reports(detected_at);
CREATE INDEX idx_drift_reports_critical ON model_drift_reports(is_critical);

-- Model Versions
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'stable', -- stable, active, unstable
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    rollback_reason JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_model_versions_status ON model_versions(status);

-- ============================================
-- CALENDLY INTEGRATION
-- ============================================

-- Add Calendly fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendly_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendly_event_type VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendly_event_type_uri TEXT;

CREATE INDEX IF NOT EXISTS idx_users_calendly ON users(calendly_username) WHERE calendly_username IS NOT NULL;

-- Appointment Offerings (3-slot quick booking)
CREATE TABLE IF NOT EXISTS appointment_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    offered_slots JSONB NOT NULL, -- Array of 3 datetime slots
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointment_offerings_lead ON appointment_offerings(lead_id);

-- Add calendar fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS join_url TEXT;

-- ============================================
-- ADDITIONAL MISSING FIELDS
-- ============================================

-- Add email to leads table (for GDPR and Calendly)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- Add calendar provider to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(50); -- 'calendly', 'google', 'outlook'
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_credentials JSONB;

-- Add SDR level for routing
ALTER TABLE users ADD COLUMN IF NOT EXISTS sdr_level VARCHAR(50); -- 'junior', 'mid', 'senior'
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ab_experiments IS 'A/B testing experiments for psychology variants';
COMMENT ON TABLE ab_assignments IS 'Lead assignments to experiment variants';
COMMENT ON TABLE ab_results IS 'Experiment results and metrics';
COMMENT ON TABLE gdpr_deletion_requests IS 'GDPR data deletion requests with approval workflow';
COMMENT ON TABLE model_predictions IS 'AI model predictions for drift monitoring';
COMMENT ON TABLE model_drift_reports IS 'Weekly model drift detection reports';
COMMENT ON TABLE model_versions IS 'Model version tracking and rollback management';
COMMENT ON TABLE appointment_offerings IS 'Quick 3-slot appointment offerings to leads';

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default model version
INSERT INTO model_versions (model_version, status, deployed_at)
VALUES ('1.0', 'active', NOW())
ON CONFLICT (model_version) DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-expire experiments
CREATE OR REPLACE FUNCTION expire_experiments()
RETURNS void AS $$
BEGIN
    UPDATE ab_experiments
    SET status = 'completed', stopped_at = NOW()
    WHERE status = 'active'
      AND started_at < NOW() - (duration_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (if using RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_drift_reports ENABLE ROW LEVEL SECURITY;

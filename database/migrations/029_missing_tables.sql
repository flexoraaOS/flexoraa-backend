-- Migration 029: Missing Tables for Complete System
-- Adds: qualification state, leakage events, recovery logs, SLA metrics, Gmail integration

-- Lead Qualification State (6-turn interview tracking)
CREATE TABLE IF NOT EXISTS lead_qualification_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    current_turn INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
    extracted_data JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(lead_id)
);

CREATE INDEX idx_qualification_state_lead ON lead_qualification_state(lead_id);
CREATE INDEX idx_qualification_state_status ON lead_qualification_state(status);

-- Lead Leakage Events
CREATE TABLE IF NOT EXISTS lead_leakage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    score INTEGER,
    action VARCHAR(50) NOT NULL, -- ai_reengage, reassign, escalate
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leakage_events_lead ON lead_leakage_events(lead_id);
CREATE INDEX idx_leakage_events_detected ON lead_leakage_events(detected_at);

-- Lead Reassignment Log
CREATE TABLE IF NOT EXISTS lead_reassignment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_sdr_id UUID REFERENCES users(id),
    new_sdr_id UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    reassigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reassignment_log_lead ON lead_reassignment_log(lead_id);

-- Lead Recovery Log
CREATE TABLE IF NOT EXISTS lead_recovery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    response_received BOOLEAN DEFAULT FALSE,
    response_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recovery_log_lead ON lead_recovery_log(lead_id);
CREATE INDEX idx_recovery_log_sent ON lead_recovery_log(sent_at);

-- Payment Orders (Razorpay)
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_type VARCHAR(50) NOT NULL, -- token_topup, subscription
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, completed, failed
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payment_orders_tenant ON payment_orders(tenant_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_razorpay ON payment_orders(razorpay_order_id);

-- Gmail Poll State
CREATE TABLE IF NOT EXISTS gmail_poll_state (
    tenant_id UUID PRIMARY KEY,
    last_poll_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Credentials (OAuth tokens)
CREATE TABLE IF NOT EXISTS integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL, -- gmail, instagram, facebook
    oauth_credentials JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, revoked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_integration_creds_tenant ON integration_credentials(tenant_id);
CREATE INDEX idx_integration_creds_provider ON integration_credentials(provider);

-- SLA Metrics
CREATE TABLE IF NOT EXISTS sla_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requests_total INTEGER NOT NULL DEFAULT 0,
    errors_total INTEGER NOT NULL DEFAULT 0,
    error_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    p90_ai_message INTEGER, -- milliseconds
    p90_verification INTEGER,
    p90_routing INTEGER,
    uptime_percent DECIMAL(5, 2) NOT NULL DEFAULT 100
);

CREATE INDEX idx_sla_metrics_timestamp ON sla_metrics(timestamp);

-- SLA Violations
CREATE TABLE IF NOT EXISTS sla_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric VARCHAR(100) NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    actual_value DECIMAL(10, 2) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- warning, critical
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sla_violations_detected ON sla_violations(detected_at);
CREATE INDEX idx_sla_violations_severity ON sla_violations(severity);

-- SLA Daily Reports
CREATE TABLE IF NOT EXISTS sla_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    metrics JSONB NOT NULL,
    violations JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sla_daily_reports_date ON sla_daily_reports(report_date);

-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_recovery_attempted BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_recovery_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_priority VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_sla VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_leads_last_customer_message ON leads(last_customer_message_at);
CREATE INDEX IF NOT EXISTS idx_leads_ai_recovery ON leads(ai_recovery_attempted, ai_recovery_at);

-- Subscriptions table (if not exists)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    plan_name VARCHAR(100) NOT NULL, -- LeadOS Starter, AgentOS Pro, Full OS
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired
    token_allocation INTEGER NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal', -- low, normal, urgent
    reference_id UUID,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Comments
COMMENT ON TABLE lead_qualification_state IS '6-turn AI qualification interview tracking';
COMMENT ON TABLE lead_leakage_events IS 'Lead leakage detection and prevention events';
COMMENT ON TABLE lead_recovery_log IS 'Cold lead 24h recovery attempts';
COMMENT ON TABLE payment_orders IS 'Razorpay payment orders for token top-ups';
COMMENT ON TABLE sla_metrics IS 'SLA monitoring metrics (uptime, response times, error rates)';
COMMENT ON TABLE integration_credentials IS 'OAuth credentials for Gmail, Instagram, Facebook';

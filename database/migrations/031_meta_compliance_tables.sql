-- Migration 031: Meta Messaging Platforms Compliance Tables
-- WhatsApp, Instagram, Facebook Messenger compliance tracking

-- ============================================
-- WHATSAPP COMPLIANCE
-- ============================================

-- WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- authentication, transactional, marketing
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    quality_score DECIMAL(3, 2) DEFAULT 5.0,
    meta_template_id VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_whatsapp_templates_tenant ON whatsapp_templates(tenant_id);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);

-- Add WhatsApp fields to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_tier INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_quality_score DECIMAL(3, 2) DEFAULT 5.0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_verification_status VARCHAR(50) DEFAULT 'unverified';

-- Add WhatsApp fields to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50); -- freeform, template, marketing_template, etc.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta_cost DECIMAL(10, 4) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_template ON messages(template_name) WHERE template_name IS NOT NULL;

-- ============================================
-- INSTAGRAM COMPLIANCE
-- ============================================

-- Instagram Engagements (for DM eligibility tracking)
CREATE TABLE IF NOT EXISTS instagram_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    engagement_type VARCHAR(50) NOT NULL, -- comment, story_reply, mention, dm
    engagement_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_instagram_engagements_lead ON instagram_engagements(lead_id);
CREATE INDEX idx_instagram_engagements_type ON instagram_engagements(engagement_type);
CREATE INDEX idx_instagram_engagements_expires ON instagram_engagements(expires_at);

-- Instagram Rate Limit Tracking
CREATE TABLE IF NOT EXISTS instagram_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    hour_window TIMESTAMP WITH TIME ZONE NOT NULL,
    dm_count INTEGER DEFAULT 0,
    comment_ops_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, hour_window)
);

CREATE INDEX idx_instagram_rate_limits_tenant ON instagram_rate_limits(tenant_id);
CREATE INDEX idx_instagram_rate_limits_window ON instagram_rate_limits(hour_window);

-- ============================================
-- FACEBOOK MESSENGER COMPLIANCE
-- ============================================

-- Add Facebook opt-in tracking to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_opted_in BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_opt_in_at TIMESTAMP WITH TIME ZONE;

-- Facebook Subscription Message Tracking
CREATE TABLE IF NOT EXISTS facebook_subscription_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    message_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_facebook_subscription_lead ON facebook_subscription_messages(lead_id);
CREATE INDEX idx_facebook_subscription_expires ON facebook_subscription_messages(expires_at);

-- ============================================
-- CROSS-PLATFORM COMPLIANCE TRACKING
-- ============================================

-- Meta Compliance Violations Log
CREATE TABLE IF NOT EXISTS meta_compliance_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL, -- whatsapp, instagram, facebook
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- warning, critical, suspension
    description TEXT,
    lead_id UUID REFERENCES leads(id),
    message_id UUID REFERENCES messages(id),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

CREATE INDEX idx_meta_violations_tenant ON meta_compliance_violations(tenant_id);
CREATE INDEX idx_meta_violations_platform ON meta_compliance_violations(platform);
CREATE INDEX idx_meta_violations_severity ON meta_compliance_violations(severity);
CREATE INDEX idx_meta_violations_detected ON meta_compliance_violations(detected_at);

-- Meta Quality Scores History
CREATE TABLE IF NOT EXISTS meta_quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    score DECIMAL(3, 2) NOT NULL,
    block_rate DECIMAL(5, 4),
    engagement_rate DECIMAL(5, 4),
    complaint_rate DECIMAL(5, 4),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meta_quality_tenant ON meta_quality_scores(tenant_id);
CREATE INDEX idx_meta_quality_platform ON meta_quality_scores(platform);
CREATE INDEX idx_meta_quality_recorded ON meta_quality_scores(recorded_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-expire Instagram engagements
CREATE OR REPLACE FUNCTION expire_instagram_engagements()
RETURNS void AS $$
BEGIN
    DELETE FROM instagram_engagements
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limit_records()
RETURNS void AS $$
BEGIN
    DELETE FROM instagram_rate_limits
    WHERE hour_window < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates with Meta approval status';
COMMENT ON TABLE instagram_engagements IS 'Instagram engagement triggers for DM eligibility (24h window)';
COMMENT ON TABLE instagram_rate_limits IS 'Instagram rate limit tracking (200 DMs/hour, 200 ops/hour)';
COMMENT ON TABLE facebook_subscription_messages IS 'Facebook subscription message tracking (1 per user per 24h)';
COMMENT ON TABLE meta_compliance_violations IS 'Meta platform compliance violations and warnings';
COMMENT ON TABLE meta_quality_scores IS 'Historical quality scores for WhatsApp/Instagram/Facebook';

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_subscription_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_quality_scores ENABLE ROW LEVEL SECURITY;

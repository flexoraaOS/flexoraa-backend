-- Migration: Additional tables for PRD v2 compliance features
-- Description: Abuse events, human review queue, tenants tier, consent records, PII masking

-- Tenants table enhancements (add tier)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'tier_1';

-- Abuse events tracking
CREATE TABLE IF NOT EXISTS abuse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patterns JSONB NOT NULL,
    action_taken VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Human review queue (for high-risk queries)
CREATE TABLE IF NOT EXISTS human_review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    message_text TEXT NOT NULL,
    risk_categories JSONB,
    keywords JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved
    assigned_auditor_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT
);

-- Consent records (compliance)
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    channel VARCHAR(50) NOT NULL,
    consent_given BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PII masking log
CREATE TABLE IF NOT EXISTS pii_masking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    field_name VARCHAR(100),
    masked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(255)
);

-- WhatsApp templates (for compliance)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50),
    template_content TEXT NOT NULL,
    template_variables JSONB,
    is_approved BOOLEAN DEFAULT false,
    meta_template_id VARCHAR(255), -- Meta's template ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Update leads table for verification
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20),
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS device_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_recovery_attempted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_recovery_at TIMESTAMP WITH TIME ZONE;

-- Update messages table for intent
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS intent VARCHAR(50),
ADD COLUMN IF NOT EXISTS emotional_tone VARCHAR(50);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abuse_events_tenant ON abuse_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_human_review_status ON human_review_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_consent_records_lead ON consent_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_verification ON leads(verification_status);
CREATE INDEX IF NOT EXISTS idx_leads_fraud ON leads(fraud_score);
CREATE INDEX IF NOT EXISTS idx_messages_intent ON messages(intent);

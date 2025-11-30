-- Migration: Missing Backend Features for Frontend Connection
-- Date: November 30, 2025
-- Purpose: Add tables for CSV import, lead assignment, analytics, and admin features

-- Import logs table
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    total INTEGER NOT NULL DEFAULT 0,
    successful INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    duplicates INTEGER NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_logs_tenant ON import_logs(tenant_id);
CREATE INDEX idx_import_logs_created ON import_logs(created_at DESC);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'lead_assigned', 'lead_reassigned', 'threshold_alert', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'archived'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    archived_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Background jobs table (for async processing)
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- 'csv_import', 'email_send', 'data_export', etc.
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payload JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    error TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_background_jobs_status ON background_jobs(status);
CREATE INDEX idx_background_jobs_scheduled ON background_jobs(scheduled_at);
CREATE INDEX idx_background_jobs_tenant ON background_jobs(tenant_id);

-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range TEXT; -- '$1K-5K', '$5K-50K', '$50K+'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT; -- 'Immediate', '1-3mo', '3-6mo', 'Exploring'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_confidence FLOAT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline_confidence FLOAT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_assigned_by ON leads(assigned_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_at ON leads(assigned_at);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_at ON leads(qualified_at);
CREATE INDEX IF NOT EXISTS idx_leads_converted_at ON leads(converted_at);
CREATE INDEX IF NOT EXISTS idx_leads_budget_range ON leads(budget_range);
CREATE INDEX IF NOT EXISTS idx_leads_timeline ON leads(timeline);

-- Add missing columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'tier_1'; -- 'tier_1', 'tier_2', 'tier_3', 'tier_4'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'suspended', 'inactive'

-- User metadata table (if not exists)
CREATE TABLE IF NOT EXISTS user_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'admin', 'manager', 'sdr', 'viewer'
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_metadata_user ON user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_tenant ON user_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_role ON user_metadata(role);

-- Payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_method TEXT, -- 'razorpay', 'stripe', 'manual'
    payment_id TEXT, -- External payment ID
    tokens_purchased INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Conversations table (if not exists)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'gmail'
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'archived'
    assigned_to UUID REFERENCES users(id),
    last_message_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages table (if not exists)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    sender_type TEXT NOT NULL, -- 'lead', 'ai', 'sdr', 'system'
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    channel TEXT NOT NULL,
    external_id TEXT, -- External message ID from WhatsApp/Instagram/etc
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external ON messages(external_id);

-- Abuse events table (if not exists)
CREATE TABLE IF NOT EXISTS abuse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patterns JSONB NOT NULL,
    action_taken TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_events_tenant ON abuse_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abuse_events_resolved ON abuse_events(resolved);
CREATE INDEX IF NOT EXISTS idx_abuse_events_created ON abuse_events(created_at DESC);

-- Add comments
COMMENT ON TABLE import_logs IS 'Tracks CSV import history and results';
COMMENT ON TABLE notifications IS 'User notifications for lead assignments, alerts, etc';
COMMENT ON TABLE background_jobs IS 'Async job queue for long-running tasks';
COMMENT ON TABLE user_metadata IS 'User roles and metadata per tenant';
COMMENT ON TABLE payments IS 'Payment transactions for token purchases';
COMMENT ON TABLE conversations IS 'Omnichannel conversation threads';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE abuse_events IS 'Abuse detection and prevention events';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON import_logs TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON notifications TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON background_jobs TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON user_metadata TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON payments TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON conversations TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON messages TO flexoraa_app;
GRANT SELECT, INSERT, UPDATE ON abuse_events TO flexoraa_app;

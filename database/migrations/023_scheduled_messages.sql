-- Migration: Scheduled Messages
-- Description: Table for storing messages to be sent at a future time

CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    lead_id UUID REFERENCES leads(id),
    channel VARCHAR(50) NOT NULL, -- whatsapp, instagram, facebook, email
    content JSONB NOT NULL, -- { type: 'text', body: '...' }
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed, canceled
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_process ON scheduled_messages(status, scheduled_at) WHERE status = 'pending';

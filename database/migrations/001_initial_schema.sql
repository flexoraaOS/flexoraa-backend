-- ==================================
-- SYSTEM TABLES (PostgreSQL)
-- ==================================

-- Workflow Execution Log
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    error_message TEXT,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_name);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_executions_started ON workflow_executions(started_at DESC);

-- Error Log
CREATE TABLE IF NOT EXISTS error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id),
    error_type VARCHAR(100),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    node_name VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'error',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_execution ON error_log(execution_id);
CREATE INDEX idx_errors_created ON error_log(created_at DESC);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- WhatsApp Message Log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    message_type VARCHAR(50),
    message_body TEXT,
    template_name VARCHAR(255),
    status VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    execution_id UUID REFERENCES workflow_executions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wa_from ON whatsapp_messages(from_number);
CREATE INDEX idx_wa_timestamp ON whatsapp_messages(timestamp DESC);

-- KlickTipp Events
CREATE TABLE IF NOT EXISTS klicktipp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    subscriber_email VARCHAR(255),
    subscriber_phone VARCHAR(50),
    custom_fields JSONB,
    raw_payload JSONB,
    execution_id UUID REFERENCES workflow_executions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kt_email ON klicktipp_events(subscriber_email);
CREATE INDEX idx_kt_phone ON klicktipp_events(subscriber_phone);
CREATE INDEX idx_kt_created ON klicktipp_events(created_at DESC);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scopes JSONB,
    rate_limit_override INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apikeys_hash ON api_keys(key_hash);
CREATE INDEX idx_apikeys_active ON api_keys(is_active);

-- ==================================
-- SUPABASE TABLES (Run in Supabase)
-- ==================================

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    initial_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    has_whatsapp BOOLEAN DEFAULT false,
    conversation_score INTEGER DEFAULT 0,
    temperature VARCHAR(20) DEFAULT 'cold',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_phone ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_whatsapp ON leads(has_whatsapp);

-- n8n Chat Histories (LangChain)
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
    id VARCHAR(255) PRIMARY KEY,
    phone_number VARCHAR(20),
    message JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_phone ON n8n_chat_histories(phone_number);

-- Migration: Routing and Escalation Tables
-- Description: Tables for intelligent routing, escalations, appointments, and leakage prevention

-- Users table enhancements (add SDR levels and activity status)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sdr_level VARCHAR(20) DEFAULT 'mid', -- junior, mid, senior
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Routing history
CREATE TABLE IF NOT EXISTS lead_routing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    sdr_id UUID REFERENCES users(id),
    score INTEGER,
    priority VARCHAR(20), -- urgent, normal, low
    sla VARCHAR(20), -- 10m, 24-72h, etc.
    routed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalations
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    sdr_id UUID REFERENCES users(id),
    triggers JSONB, -- Array of trigger reasons
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    sdr_id UUID REFERENCES users(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    calendar_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    offered_slots JSONB, -- Array of DateTime slots
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled tasks (for reminders, AI recovery, etc.)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(50) NOT NULL, -- appointment_reminder, ai_recovery, etc.
    reference_id UUID, -- appointment_id, lead_id, etc.
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead leakage events
CREATE TABLE IF NOT EXISTS lead_leakage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    score INTEGER,
    action VARCHAR(50), -- ai_reengage, reassign, escalate
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50), -- follow_up, reminder, promotional, etc.
    template_content TEXT NOT NULL,
    template_variables JSONB,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS assigned_sdr_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS routing_priority VARCHAR(20),
ADD COLUMN IF NOT EXISTS routing_sla VARCHAR(20),
ADD COLUMN IF NOT EXISTS routed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_reason JSONB,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_appointment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointment_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routing_history_lead ON lead_routing_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_escalations_lead ON escalations(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_time ON scheduled_tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_leakage_events_lead ON lead_leakage_events(lead_id);

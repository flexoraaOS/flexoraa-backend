-- Migration 001: Core Schema
-- Creates: users, campaigns, leads tables
-- Version: 1.0.0
-- Date: 2025-11-28

-- Users table (multi-tenant)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- nullable for OAuth users
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- user, admin, sdr
  tenant_id UUID NOT NULL, -- for multi-tenancy
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  api_key_hash VARCHAR(255), -- hashed API key for webhook auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  initial_prompt TEXT, -- AI prompt template for this campaign
  whatsapp_template_name VARCHAR(255), -- WhatsApp template identifier
  whatsapp_template_language VARCHAR(10) DEFAULT 'de',
  lead_source VARCHAR(100), -- campaign_webhook, manual, import
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb -- flexible fields for campaign config
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_metadata ON campaigns USING GIN(metadata);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL, -- will be encrypted at application layer
  name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, contacted, qualified, converted, lost
  lead_score INTEGER,  -- deterministic score (0-100)
  lead_score_ai INTEGER, -- AI-generated score (0-100)
  lead_score_explain JSONB, -- AI explainability: { features: [...], contributions: [...] }
  lead_temperature VARCHAR(20), -- HOT, WARM, COLD based on thresholds
  assigned_to UUID REFERENCES users(id), -- SDR assignment
  assigned_at TIMESTAMP WITH TIME ZONE,
  phone_verified BOOLEAN DEFAULT FALSE,
  consent_status VARCHAR(50) DEFAULT 'pending', -- pending, opted_in, opted_out
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_phone ON leads(phone_number); -- encrypted field
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_temperature ON leads(lead_temperature);
CREATE INDEX idx_leads_metadata ON leads USING GIN(metadata);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - enables but policies defined per environment
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE users IS 'Multi-tenant user accounts with API key auth';
COMMENT ON TABLE campaigns IS 'Marketing campaigns with WhatsApp templates';
COMMENT ON TABLE leads IS 'Lead records with AI scoring and assignment';
COMMENT ON COLUMN leads.lead_score_explain IS 'AI explainability JSON: features and contributions';

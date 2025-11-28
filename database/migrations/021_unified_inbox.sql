-- Migration: Unified Inbox Schema
-- Description: Add support for Instagram and Facebook channels in messages table

-- Enum for message channels
CREATE TYPE message_channel AS ENUM ('whatsapp', 'instagram', 'facebook', 'email', 'sms');

-- Enum for message types
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location', 'sticker', 'reaction', 'template');

-- Update messages table or create if not exists (assuming it might exist from WhatsApp implementation)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    lead_id UUID REFERENCES leads(id),
    
    -- Channel info
    channel message_channel NOT NULL,
    external_id VARCHAR(255), -- ID from WhatsApp/Insta/FB
    
    -- Sender info
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    sender_id VARCHAR(255), -- Phone number or Social ID
    
    -- Content
    type message_type DEFAULT 'text',
    body TEXT,
    media_url TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast retrieval of conversation history
CREATE INDEX IF NOT EXISTS idx_messages_lead_channel ON messages(lead_id, channel);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created ON messages(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_id);

-- Social Accounts table to link leads to social profiles
CREATE TABLE IF NOT EXISTS social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- instagram, facebook
    platform_user_id VARCHAR(255) NOT NULL, -- Scoped User ID
    username VARCHAR(255),
    profile_pic_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_lead ON social_profiles(lead_id);

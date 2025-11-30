-- Migration: Advanced Scoring
-- Description: Add fields for 5-factor scoring algorithm

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}', -- Stores { budget: 30, intent: 25, ... }
ADD COLUMN IF NOT EXISTS psychology_profile JSONB DEFAULT '{}', -- Stores { dominant_driver: 'scarcity', ... }
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_estimate DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS intent_level VARCHAR(20) DEFAULT 'low'; -- low, medium, high

-- Index for fast sorting by score
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);

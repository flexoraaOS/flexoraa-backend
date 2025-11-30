-- Migration: Token Economy
-- Description: Tables for tracking token usage and balances

-- Token Balances Table (Current snapshot)
CREATE TABLE IF NOT EXISTS token_balances (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    is_paused BOOLEAN DEFAULT false, -- Paused if balance <= 0 or abuse detected
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token Ledger Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS token_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    amount DECIMAL(10, 2) NOT NULL, -- Negative for deduction, Positive for top-up
    operation_type VARCHAR(50) NOT NULL, -- 'verification', 'ai_response', 'top_up', 'bonus'
    description TEXT,
    reference_id VARCHAR(100), -- Linked payment ID or message ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_ledger_tenant ON token_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_token_ledger_created ON token_ledger(created_at);

-- Trigger to update balance automatically
CREATE OR REPLACE FUNCTION update_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO token_balances (tenant_id, balance, updated_at)
    VALUES (NEW.tenant_id, NEW.amount, NOW())
    ON CONFLICT (tenant_id)
    DO UPDATE SET 
        balance = token_balances.balance + NEW.amount,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_balance
AFTER INSERT ON token_ledger
FOR EACH ROW
EXECUTE FUNCTION update_token_balance();

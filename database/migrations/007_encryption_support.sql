-- Migration 007: Encryption Support
-- Widens columns for ciphertext and adds hash columns for blind indexing

-- Leads table updates
ALTER TABLE leads ALTER COLUMN phone_number TYPE TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64); -- In case we add email later

CREATE INDEX IF NOT EXISTS idx_leads_phone_hash ON leads(phone_hash);
CREATE INDEX IF NOT EXISTS idx_leads_email_hash ON leads(email_hash);

-- Consent Log updates
ALTER TABLE consent_log ALTER COLUMN phone_number TYPE TEXT;
ALTER TABLE consent_log ALTER COLUMN email TYPE TEXT;
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);
ALTER TABLE consent_log ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_consent_phone_hash ON consent_log(phone_hash);
CREATE INDEX IF NOT EXISTS idx_consent_email_hash ON consent_log(email_hash);

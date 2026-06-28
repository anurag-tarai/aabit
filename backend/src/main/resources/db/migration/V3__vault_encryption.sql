-- Add vault key envelope columns to user_account
ALTER TABLE user_account
    ADD COLUMN IF NOT EXISTS vault_pin_wrapped    TEXT,
    ADD COLUMN IF NOT EXISTS vault_phrase_wrapped TEXT;

-- Add encryption flag to experience_entry
ALTER TABLE experience_entry
    ADD COLUMN IF NOT EXISTS client_encrypted BOOLEAN NOT NULL DEFAULT FALSE;
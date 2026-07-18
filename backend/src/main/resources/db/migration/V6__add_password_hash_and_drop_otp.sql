ALTER TABLE user_account ADD COLUMN password_hash VARCHAR(255);

DROP TABLE IF EXISTS otp_session;

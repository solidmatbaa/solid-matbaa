-- Email OTP verification (replaces link-based email verification)

CREATE TABLE IF NOT EXISTS otp_verifications (
  email TEXT PRIMARY KEY,
  otp_code TEXT NOT NULL CHECK (char_length(otp_code) = 6),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only (accessed via server API routes)

-- Razorpay subscription tracking on user_preferences.
-- Run in Supabase Dashboard → SQL Editor. Non-destructive (adds columns).

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status      text,   -- active | cancelled | halted | expired
  ADD COLUMN IF NOT EXISTS subscription_expires_at  timestamptz;

-- Fast lookup for the re-lock cron and webhook grants.
CREATE INDEX IF NOT EXISTS user_prefs_sub_expiry_idx
  ON user_preferences (subscription_expires_at)
  WHERE subscription_tier IS NOT NULL AND subscription_tier <> 'free';

CREATE INDEX IF NOT EXISTS user_prefs_sub_id_idx
  ON user_preferences (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

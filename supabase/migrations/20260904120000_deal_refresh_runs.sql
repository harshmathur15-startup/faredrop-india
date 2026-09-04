-- Stores one row per daily deal-price refresh run (see /api/cron/refresh-deals).
-- The public /api/deal-refresh/latest endpoint reads the newest row so the
-- Claude routine can push a morning summary to the Claude mobile app.
CREATE TABLE IF NOT EXISTS deal_refresh_runs (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at  timestamptz NOT NULL DEFAULT now(),
  summary jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS deal_refresh_runs_ran_at_idx
  ON deal_refresh_runs (ran_at DESC);

-- Service role only (routes use the service key); no anon/public access.
ALTER TABLE deal_refresh_runs ENABLE ROW LEVEL SECURITY;

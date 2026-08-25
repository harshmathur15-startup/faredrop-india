-- ============================================================================
-- Phase 4: explore_cache hygiene + compact daily price-intelligence table
-- ============================================================================
-- SAFE TO APPLY ANYTIME. explore_cache has ~20 rows, route_price_daily is new.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- explore_cache: cache_key must be unique so upserts UPDATE-in-place rather
-- than pile up duplicate rows; created_at index supports 48h cleanup deletes.
-- (If historical duplicate cache_keys exist, de-dupe before the unique index.)
-- ---------------------------------------------------------------------------
DELETE FROM explore_cache a
USING explore_cache b
WHERE a.cache_key = b.cache_key
  AND a.created_at < b.created_at;   -- keep the newest row per cache_key

CREATE UNIQUE INDEX IF NOT EXISTS explore_cache_cache_key_uidx ON explore_cache (cache_key);
CREATE INDEX        IF NOT EXISTS explore_cache_created_at_idx ON explore_cache (created_at);

-- ---------------------------------------------------------------------------
-- route_price_daily: one compact summary row per
-- route / departure / return / trip-type / cabin / max-stops / observation-day.
-- Retains price intelligence for ~180 days WITHOUT keeping raw API payloads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_price_daily (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_iata        text    NOT NULL,
  dest_iata          text    NOT NULL,
  departure_date     date    NOT NULL,
  return_date        date,                       -- NULL for one-way
  trip_type          text    NOT NULL DEFAULT 'roundtrip',
  cabin_class        text    NOT NULL DEFAULT 'economy',
  maximum_stops      int     NOT NULL DEFAULT 0, -- max(out_stops, ret_stops)
  observation_date   date    NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  minimum_price_inr  numeric NOT NULL,
  average_price_inr  numeric NOT NULL,
  maximum_price_inr  numeric NOT NULL,
  observation_count  integer NOT NULL DEFAULT 1,
  last_retrieved_at  timestamptz NOT NULL DEFAULT now()
);

-- One summary row per logical bucket per day. NULLS NOT DISTINCT (PG15+) makes
-- one-way rows (return_date IS NULL) collapse correctly instead of duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS route_price_daily_bucket_uidx
  ON route_price_daily (
    origin_iata, dest_iata, departure_date, return_date,
    trip_type, cabin_class, maximum_stops, observation_date
  ) NULLS NOT DISTINCT;

-- Fast "recent history for this route" lookups.
CREATE INDEX IF NOT EXISTS route_price_daily_route_obs_idx
  ON route_price_daily (origin_iata, dest_iata, observation_date DESC);

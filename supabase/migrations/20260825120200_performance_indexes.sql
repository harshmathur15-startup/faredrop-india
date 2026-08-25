-- ============================================================================
-- Phase 6: Query indexes driven by real access patterns
-- ============================================================================
-- Only the indexes the rewritten queries actually use. Partial indexes keep
-- them small (only "current" rows / active rows). Validate each with
-- EXPLAIN (ANALYZE, BUFFERS) after applying.
--
-- NOTE: the partial UNIQUE index that enforces "one current row per
-- itinerary_key" is intentionally created LATER, in the Phase 10 runbook, only
-- AFTER existing duplicates are collapsed (see supabase/phase10_cleanup_runbook.sql).
-- Creating it now would fail because today every historical row is non-superseded.
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction. When applying via
-- the Supabase SQL editor (autocommit) these run fine as-is. If you apply this
-- file inside an explicit transaction, drop the CONCURRENTLY keyword.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- flight_itineraries
-- ---------------------------------------------------------------------------

-- Primary cache lookup: route + cabin + trip-type (equality) + out_depart
-- (range) + price ordering, restricted to current (non-superseded) rows.
-- Serves both /api/admin/fetch-fares and the cron getBestPrice() lookup.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fi_current_route_lookup_idx
  ON flight_itineraries (search_origin, search_dest, cabin_class, trip_type, out_depart, price_inr)
  WHERE superseded_at IS NULL;

-- Non-superseded lookup by logical identity (used by the ingest RPC to find the
-- current row for a key). Non-unique here; the UNIQUE version is added in Phase 10.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fi_itinerary_key_current_idx
  ON flight_itineraries (itinerary_key)
  WHERE superseded_at IS NULL;

-- Cleanup scan: find superseded rows past their 48h grace window.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fi_superseded_at_idx
  ON flight_itineraries (superseded_at)
  WHERE superseded_at IS NOT NULL;

-- Redundant legacy single-column indexes are now covered by the composite above
-- (origin/dest is a prefix) or unused. Dropping them reclaims space on the
-- largest table. Kept commented so you can drop them explicitly during Phase 10
-- alongside the cleanup, once the new code path is live:
--   DROP INDEX IF EXISTS idx_fi_route;   -- (search_origin, search_dest)
--   DROP INDEX IF EXISTS idx_fi_price;   -- (price_inr)
--   DROP INDEX IF EXISTS idx_fi_stops;   -- (out_stops, ret_stops)
-- idx_fi_seen (observed_at) may still be useful for time-range analytics; review before dropping.

-- ---------------------------------------------------------------------------
-- price_history: "recent observations for a route", newest first.
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS price_history_route_observed_idx
  ON price_history (origin_iata, dest_iata, observed_at DESC);

-- ---------------------------------------------------------------------------
-- route_prices: 30-day baseline sampling, newest first.
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS route_prices_route_sampled_idx
  ON route_prices (origin_iata, dest_iata, sampled_at DESC);

-- ---------------------------------------------------------------------------
-- flight_alerts: partial index on (is_active, last_checked_at) already exists
-- as idx_flight_alerts_active_checked (supabase-alerts-schema.sql). No new index.
-- ---------------------------------------------------------------------------

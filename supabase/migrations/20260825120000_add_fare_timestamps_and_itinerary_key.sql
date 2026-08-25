-- ============================================================================
-- Phase 2: Fare timestamps + logical itinerary identity
-- ============================================================================
-- Adds proper UTC timestamps and a stable `itinerary_key` (logical identity that
-- EXCLUDES price / retrieval time / observation date) to raw fare rows, plus
-- snapshot timestamps on published deals.
--
-- SAFE TO APPLY ANYTIME: only adds nullable columns + a function + a tiny
-- backfill of the `deals` table (113 rows). The heavy 1.2M-row backfill of
-- flight_itineraries is deliberately NOT run here — it is a batched function
-- (see bottom) invoked from the gated Phase 10 runbook so it never causes a
-- CPU/lock spike or fails on a read-only (over-quota) project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. flight_itineraries: new columns (all nullable => metadata-only, instant)
-- ---------------------------------------------------------------------------
ALTER TABLE flight_itineraries
  ADD COLUMN IF NOT EXISTS price_retrieved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deal_calculated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at    timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_at       timestamptz,
  ADD COLUMN IF NOT EXISTS itinerary_key       text;

COMMENT ON COLUMN flight_itineraries.price_retrieved_at IS 'Exact time the flight API returned this fare (UTC).';
COMMENT ON COLUMN flight_itineraries.deal_calculated_at IS 'Time Travelbaby computed baseline/discount/tier for this fare (UTC).';
COMMENT ON COLUMN flight_itineraries.last_verified_at   IS 'Most recent successful verification of this fare (UTC).';
COMMENT ON COLUMN flight_itineraries.superseded_at      IS 'Set when a newer version replaced this row. NULL = current. Superseded rows are deleted 48h later.';
COMMENT ON COLUMN flight_itineraries.itinerary_key      IS 'Stable logical identity: route+trip+cabin+legs. EXCLUDES price/timestamp/observation-day so a re-price does NOT create a new identity.';

-- ---------------------------------------------------------------------------
-- 2. Canonical itinerary_key builder (IMMUTABLE).
--    Must byte-for-byte match the TypeScript buildItineraryKey() in
--    src/lib/parseFlightApi.ts. Timestamps are rendered as 'YYYY-MM-DDTHH:MI:SS'
--    (19 chars) to match the app's `.slice(0,19)` normalisation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fi_itinerary_key(
  p_search_origin text,
  p_search_dest   text,
  p_trip_type     text,
  p_cabin_class   text,
  p_out_depart    timestamp,
  p_out_arrive    timestamp,
  p_out_airline   text,
  p_out_stops     int,
  p_out_via       text,
  p_ret_depart    timestamp,
  p_ret_arrive    timestamp,
  p_ret_airline   text,
  p_ret_stops     int,
  p_ret_via       text
) RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT array_to_string(ARRAY[
    coalesce(p_search_origin, ''),
    coalesce(p_search_dest, ''),
    coalesce(p_trip_type, ''),
    lower(coalesce(p_cabin_class, '')),
    coalesce(to_char(p_out_depart, 'YYYY-MM-DD"T"HH24:MI:SS'), ''),
    coalesce(to_char(p_out_arrive, 'YYYY-MM-DD"T"HH24:MI:SS'), ''),
    coalesce(p_out_airline, ''),
    coalesce(p_out_stops::text, ''),
    coalesce(p_out_via, ''),
    coalesce(to_char(p_ret_depart, 'YYYY-MM-DD"T"HH24:MI:SS'), ''),
    coalesce(to_char(p_ret_arrive, 'YYYY-MM-DD"T"HH24:MI:SS'), ''),
    coalesce(p_ret_airline, ''),
    coalesce(p_ret_stops::text, ''),
    coalesce(p_ret_via, '')
  ], '|');
$$;

-- ---------------------------------------------------------------------------
-- 3. published deals: keep their own fare + calculation snapshot so the deal
--    survives even after the underlying raw itinerary is deleted.
-- ---------------------------------------------------------------------------
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS price_retrieved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deal_calculated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at    timestamptz;

-- deals is tiny (~113 rows) => inline backfill is safe.
UPDATE deals
SET price_retrieved_at = COALESCE(price_retrieved_at, published_at, created_at),
    deal_calculated_at = COALESCE(deal_calculated_at, published_at, created_at),
    last_verified_at   = COALESCE(last_verified_at,   published_at, created_at)
WHERE price_retrieved_at IS NULL
   OR deal_calculated_at IS NULL
   OR last_verified_at   IS NULL;

-- ---------------------------------------------------------------------------
-- 4. Batched backfill for flight_itineraries (run from Phase 10 runbook).
--    Fills itinerary_key + timestamps from observed_at for up to p_limit rows
--    that are not yet backfilled. Returns the number of rows updated so the
--    caller can loop until it returns 0.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION backfill_fi_identity(p_limit int DEFAULT 5000)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer;
BEGIN
  WITH batch AS (
    SELECT id
    FROM flight_itineraries
    WHERE itinerary_key IS NULL
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE flight_itineraries f
  SET itinerary_key = fi_itinerary_key(
        f.search_origin, f.search_dest, f.trip_type, f.cabin_class,
        f.out_depart, f.out_arrive, f.out_airline, f.out_stops, f.out_via,
        f.ret_depart, f.ret_arrive, f.ret_airline, f.ret_stops, f.ret_via),
      price_retrieved_at = COALESCE(f.price_retrieved_at, f.observed_at),
      deal_calculated_at = COALESCE(f.deal_calculated_at, f.observed_at),
      last_verified_at   = COALESCE(f.last_verified_at,   f.observed_at)
  FROM batch
  WHERE f.id = batch.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION backfill_fi_identity(int) IS 'Batched backfill of itinerary_key + fare timestamps for flight_itineraries. Loop until it returns 0. Run during the gated Phase 10 cleanup.';

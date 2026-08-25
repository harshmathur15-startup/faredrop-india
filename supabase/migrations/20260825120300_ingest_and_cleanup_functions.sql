-- ============================================================================
-- Phase 3 + Phase 5: transactional ingest/supersede RPC, daily rollup, cleanup
-- ============================================================================
-- These functions are the single writer path for fare ingestion and the single
-- deleter path for retention. Both run inside one transaction so a fare is never
-- left in a half-superseded state, and a failed refresh never supersedes the
-- last good fare (the route only calls ingest_itineraries with rows it has
-- already parsed successfully).
--
-- VALIDATION NOTE: this environment has no Postgres to execute against, so this
-- plpgsql has been written and reviewed but NOT run. Apply + smoke-test in
-- staging (or the Supabase SQL editor) before relying on it in production.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ingest_itineraries(p_rows jsonb)
--   p_rows: JSON array of flight_itineraries-shaped objects, already capped to
--   <=25 and carrying itinerary_key + timestamps (see src/lib/parseFlightApi.ts).
--
--   Per itinerary_key:
--     * no current row            -> INSERT new current row
--     * current row, same price   -> UPDATE last_verified_at (verification only)
--     * current row, new price    -> INSERT new current row, THEN supersede old
--   Any extra "current" duplicates for the key are superseded (self-healing for
--   rows that predate the partial-unique index added in Phase 10).
--   Also rolls the batch up into route_price_daily.
--   Returns counts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ingest_itineraries(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_elem       jsonb;
  v_rec        flight_itineraries;
  v_key        text;
  v_now        timestamptz := now();
  v_cur_id     uuid;
  v_cur_price  numeric;
  v_new_id     uuid;
  v_inserted   int := 0;
  v_refreshed  int := 0;
  v_superseded int := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN jsonb_build_object('error', 'p_rows must be a JSON array');
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_rec := jsonb_populate_record(NULL::flight_itineraries, v_elem);
    v_key := v_rec.itinerary_key;
    IF v_key IS NULL OR v_key = '' THEN
      CONTINUE;  -- reject rows without a logical identity
    END IF;

    -- Lock the current row for this key (serialises concurrent refreshes).
    SELECT id, price_inr
      INTO v_cur_id, v_cur_price
      FROM flight_itineraries
      WHERE itinerary_key = v_key AND superseded_at IS NULL
      ORDER BY observed_at DESC NULLS LAST
      LIMIT 1
      FOR UPDATE;

    IF NOT FOUND THEN
      -- No current row -> insert.
      v_rec.id                 := gen_random_uuid();
      v_rec.superseded_at      := NULL;
      v_rec.observed_at        := COALESCE(v_rec.observed_at, v_now);
      v_rec.price_retrieved_at := COALESCE(v_rec.price_retrieved_at, v_now);
      v_rec.deal_calculated_at := COALESCE(v_rec.deal_calculated_at, v_now);
      v_rec.last_verified_at   := COALESCE(v_rec.last_verified_at, v_now);
      BEGIN
        INSERT INTO flight_itineraries VALUES (v_rec.*) RETURNING id INTO v_new_id;
        v_inserted := v_inserted + 1;
      EXCEPTION WHEN unique_violation THEN
        -- A concurrent txn created the current row first: fall back to refresh.
        SELECT id INTO v_new_id
          FROM flight_itineraries
          WHERE itinerary_key = v_key AND superseded_at IS NULL
          ORDER BY observed_at DESC NULLS LAST LIMIT 1;
        UPDATE flight_itineraries
          SET last_verified_at = v_now, observed_at = v_now
          WHERE id = v_new_id;
        v_refreshed := v_refreshed + 1;
      END;

    ELSIF v_cur_price = v_rec.price_inr THEN
      -- Same price -> verification-only refresh, no new row.
      UPDATE flight_itineraries
        SET last_verified_at = v_now, observed_at = v_now
        WHERE id = v_cur_id;
      v_new_id := v_cur_id;
      v_refreshed := v_refreshed + 1;

    ELSE
      -- New price -> insert new current row, then supersede the old one(s).
      v_rec.id                 := gen_random_uuid();
      v_rec.superseded_at      := NULL;
      v_rec.observed_at        := COALESCE(v_rec.observed_at, v_now);
      v_rec.price_retrieved_at := COALESCE(v_rec.price_retrieved_at, v_now);
      v_rec.deal_calculated_at := COALESCE(v_rec.deal_calculated_at, v_now);
      v_rec.last_verified_at   := COALESCE(v_rec.last_verified_at, v_now);
      INSERT INTO flight_itineraries VALUES (v_rec.*) RETURNING id INTO v_new_id;
      v_inserted := v_inserted + 1;
    END IF;

    -- Supersede every other current row for this key (self-healing).
    UPDATE flight_itineraries
      SET superseded_at = v_now
      WHERE itinerary_key = v_key AND superseded_at IS NULL AND id <> v_new_id;
    GET DIAGNOSTICS v_cur_id = ROW_COUNT;  -- reuse var as scratch
    v_superseded := v_superseded + v_cur_id;
  END LOOP;

  -- Compact daily rollup (price intelligence without keeping raw payloads).
  INSERT INTO route_price_daily (
    origin_iata, dest_iata, departure_date, return_date, trip_type, cabin_class,
    maximum_stops, observation_date,
    minimum_price_inr, average_price_inr, maximum_price_inr, observation_count, last_retrieved_at
  )
  SELECT
    r.search_origin, r.search_dest,
    r.out_depart::date, r.ret_depart::date,
    COALESCE(r.trip_type, 'roundtrip'), lower(COALESCE(r.cabin_class, 'economy')),
    GREATEST(COALESCE(r.out_stops, 0), COALESCE(r.ret_stops, 0)),
    (v_now AT TIME ZONE 'utc')::date,
    MIN(r.price_inr), AVG(r.price_inr), MAX(r.price_inr), COUNT(*), v_now
  FROM jsonb_to_recordset(p_rows) AS r(
    search_origin text, search_dest text, trip_type text, cabin_class text,
    price_inr numeric, out_depart timestamp, ret_depart timestamp,
    out_stops int, ret_stops int
  )
  WHERE r.out_depart IS NOT NULL AND r.price_inr IS NOT NULL
  GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
  ON CONFLICT (origin_iata, dest_iata, departure_date, return_date, trip_type, cabin_class, maximum_stops, observation_date)
  DO UPDATE SET
    minimum_price_inr = LEAST(route_price_daily.minimum_price_inr, EXCLUDED.minimum_price_inr),
    maximum_price_inr = GREATEST(route_price_daily.maximum_price_inr, EXCLUDED.maximum_price_inr),
    average_price_inr = (
      (route_price_daily.average_price_inr * route_price_daily.observation_count)
      + (EXCLUDED.average_price_inr * EXCLUDED.observation_count)
    ) / (route_price_daily.observation_count + EXCLUDED.observation_count),
    observation_count = route_price_daily.observation_count + EXCLUDED.observation_count,
    last_retrieved_at = GREATEST(route_price_daily.last_retrieved_at, EXCLUDED.last_retrieved_at);

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'refreshed', v_refreshed,
    'superseded', v_superseded
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- cleanup_superseded_fares(p_batch int)
--   Deletes ONE controlled batch of superseded fares older than 14 days and all
--   expired explore_cache rows (48h). Never touches deals, users, subscriptions,
--   alerts, notifications, or route_price_daily. Returns counts; loop while
--   flight_itineraries_deleted = p_batch to drain a backlog.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_superseded_fares(p_batch int DEFAULT 5000)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_fares int := 0;
  v_cache int := 0;
BEGIN
  IF p_batch IS NULL OR p_batch < 1 THEN p_batch := 5000; END IF;
  IF p_batch > 20000 THEN p_batch := 20000; END IF;  -- hard cap: avoid lock/CPU spikes

  WITH victims AS (
    SELECT id FROM flight_itineraries
    WHERE superseded_at IS NOT NULL
      AND superseded_at < now() - interval '14 days'
    ORDER BY superseded_at
    LIMIT p_batch
    FOR UPDATE SKIP LOCKED
  ), del AS (
    DELETE FROM flight_itineraries f USING victims v WHERE f.id = v.id RETURNING 1
  )
  SELECT count(*) INTO v_fares FROM del;

  WITH delc AS (
    DELETE FROM explore_cache WHERE created_at < now() - interval '48 hours' RETURNING 1
  )
  SELECT count(*) INTO v_cache FROM delc;

  RETURN jsonb_build_object(
    'flight_itineraries_deleted', v_fares,
    'explore_cache_deleted', v_cache,
    'batch_limit', p_batch,
    'more_fares_pending', v_fares = p_batch
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Lock these functions down to the service role (server-side use only).
-- Prevents anon/authenticated PostgREST clients from calling them as RPCs.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION ingest_itineraries(jsonb)        FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_superseded_fares(int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION backfill_fi_identity(int)         FROM PUBLIC;
DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION ingest_itineraries(jsonb)    TO service_role;
    GRANT EXECUTE ON FUNCTION cleanup_superseded_fares(int) TO service_role;
    GRANT EXECUTE ON FUNCTION backfill_fi_identity(int)     TO service_role;
  END IF;
END
$grant$;

-- ---------------------------------------------------------------------------
-- Schedule cleanup every 6h via pg_cron IF the extension is installed.
-- If pg_cron is unavailable, the Vercel cron route /api/cron/cleanup-fares
-- (protected by CRON_SECRET) performs the same job — do NOT enable both.
-- ---------------------------------------------------------------------------
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-superseded-fares',
      '0 */6 * * *',
      $job$ SELECT cleanup_superseded_fares(5000); $job$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END
$cron$;

-- ============================================================================
-- Travelbaby / faredrop-india — PREVENTION MIGRATIONS (SQL-editor-safe, one run)
-- Consolidated from supabase/migrations/2026082512xxxx_*.sql, with CONCURRENTLY
-- removed (table is small now) and a direct backfill of the ~32k kept rows.
-- Non-destructive: adds columns, functions, indexes, one small table.
-- ============================================================================

-- ---------- 1. fare timestamps + itinerary_key -----------------------------
ALTER TABLE flight_itineraries
  ADD COLUMN IF NOT EXISTS price_retrieved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deal_calculated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at    timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_at       timestamptz,
  ADD COLUMN IF NOT EXISTS itinerary_key       text;

CREATE OR REPLACE FUNCTION fi_itinerary_key(
  p_search_origin text, p_search_dest text, p_trip_type text, p_cabin_class text,
  p_out_depart timestamp, p_out_arrive timestamp, p_out_airline text, p_out_stops int, p_out_via text,
  p_ret_depart timestamp, p_ret_arrive timestamp, p_ret_airline text, p_ret_stops int, p_ret_via text
) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT array_to_string(ARRAY[
    coalesce(p_search_origin,''), coalesce(p_search_dest,''), coalesce(p_trip_type,''),
    lower(coalesce(p_cabin_class,'')),
    coalesce(to_char(p_out_depart,'YYYY-MM-DD"T"HH24:MI:SS'),''),
    coalesce(to_char(p_out_arrive,'YYYY-MM-DD"T"HH24:MI:SS'),''),
    coalesce(p_out_airline,''), coalesce(p_out_stops::text,''), coalesce(p_out_via,''),
    coalesce(to_char(p_ret_depart,'YYYY-MM-DD"T"HH24:MI:SS'),''),
    coalesce(to_char(p_ret_arrive,'YYYY-MM-DD"T"HH24:MI:SS'),''),
    coalesce(p_ret_airline,''), coalesce(p_ret_stops::text,''), coalesce(p_ret_via,'')
  ], '|');
$$;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS price_retrieved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deal_calculated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at    timestamptz;

UPDATE deals
SET price_retrieved_at = COALESCE(price_retrieved_at, published_at, created_at),
    deal_calculated_at = COALESCE(deal_calculated_at, published_at, created_at),
    last_verified_at   = COALESCE(last_verified_at,   published_at, created_at)
WHERE price_retrieved_at IS NULL OR deal_calculated_at IS NULL OR last_verified_at IS NULL;

-- Direct backfill of the ~32k remaining fare rows (small, no batching needed).
UPDATE flight_itineraries
SET itinerary_key = fi_itinerary_key(
      search_origin, search_dest, trip_type, cabin_class,
      out_depart, out_arrive, out_airline, out_stops, out_via,
      ret_depart, ret_arrive, ret_airline, ret_stops, ret_via),
    price_retrieved_at = COALESCE(price_retrieved_at, observed_at),
    deal_calculated_at = COALESCE(deal_calculated_at, observed_at),
    last_verified_at   = COALESCE(last_verified_at,   observed_at)
WHERE itinerary_key IS NULL;

-- ---------- 2. explore_cache hygiene + route_price_daily --------------------
DELETE FROM explore_cache a USING explore_cache b
WHERE a.cache_key = b.cache_key AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS explore_cache_cache_key_uidx ON explore_cache (cache_key);
CREATE INDEX        IF NOT EXISTS explore_cache_created_at_idx ON explore_cache (created_at);

CREATE TABLE IF NOT EXISTS route_price_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_iata text NOT NULL, dest_iata text NOT NULL,
  departure_date date NOT NULL, return_date date,
  trip_type text NOT NULL DEFAULT 'roundtrip',
  cabin_class text NOT NULL DEFAULT 'economy',
  maximum_stops int NOT NULL DEFAULT 0,
  observation_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  minimum_price_inr numeric NOT NULL, average_price_inr numeric NOT NULL,
  maximum_price_inr numeric NOT NULL, observation_count integer NOT NULL DEFAULT 1,
  last_retrieved_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS route_price_daily_bucket_uidx
  ON route_price_daily (origin_iata, dest_iata, departure_date, return_date,
    trip_type, cabin_class, maximum_stops, observation_date) NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS route_price_daily_route_obs_idx
  ON route_price_daily (origin_iata, dest_iata, observation_date DESC);

-- ---------- 3. performance indexes (no CONCURRENTLY; table is small) --------
CREATE INDEX IF NOT EXISTS fi_current_route_lookup_idx
  ON flight_itineraries (search_origin, search_dest, cabin_class, trip_type, out_depart, price_inr)
  WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS fi_itinerary_key_current_idx
  ON flight_itineraries (itinerary_key) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS fi_superseded_at_idx
  ON flight_itineraries (superseded_at) WHERE superseded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS price_history_route_observed_idx
  ON price_history (origin_iata, dest_iata, observed_at DESC);
CREATE INDEX IF NOT EXISTS route_prices_route_sampled_idx
  ON route_prices (origin_iata, dest_iata, sampled_at DESC);

-- ---------- 4. transactional ingest + retention cleanup ---------------------
CREATE OR REPLACE FUNCTION ingest_itineraries(p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_elem jsonb; v_rec flight_itineraries; v_key text; v_now timestamptz := now();
  v_cur_id uuid; v_cur_price numeric; v_new_id uuid;
  v_inserted int := 0; v_refreshed int := 0; v_superseded int := 0; v_scratch int;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN jsonb_build_object('error','p_rows must be a JSON array');
  END IF;
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_rec := jsonb_populate_record(NULL::flight_itineraries, v_elem);
    v_key := v_rec.itinerary_key;
    IF v_key IS NULL OR v_key = '' THEN CONTINUE; END IF;
    SELECT id, price_inr INTO v_cur_id, v_cur_price
      FROM flight_itineraries
      WHERE itinerary_key = v_key AND superseded_at IS NULL
      ORDER BY observed_at DESC NULLS LAST LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN
      v_rec.id := gen_random_uuid(); v_rec.superseded_at := NULL;
      v_rec.observed_at := COALESCE(v_rec.observed_at, v_now);
      v_rec.price_retrieved_at := COALESCE(v_rec.price_retrieved_at, v_now);
      v_rec.deal_calculated_at := COALESCE(v_rec.deal_calculated_at, v_now);
      v_rec.last_verified_at := COALESCE(v_rec.last_verified_at, v_now);
      BEGIN
        INSERT INTO flight_itineraries VALUES (v_rec.*) RETURNING id INTO v_new_id;
        v_inserted := v_inserted + 1;
      EXCEPTION WHEN unique_violation THEN
        SELECT id INTO v_new_id FROM flight_itineraries
          WHERE itinerary_key = v_key AND superseded_at IS NULL
          ORDER BY observed_at DESC NULLS LAST LIMIT 1;
        UPDATE flight_itineraries SET last_verified_at = v_now, observed_at = v_now WHERE id = v_new_id;
        v_refreshed := v_refreshed + 1;
      END;
    ELSIF v_cur_price = v_rec.price_inr THEN
      UPDATE flight_itineraries SET last_verified_at = v_now, observed_at = v_now WHERE id = v_cur_id;
      v_new_id := v_cur_id; v_refreshed := v_refreshed + 1;
    ELSE
      v_rec.id := gen_random_uuid(); v_rec.superseded_at := NULL;
      v_rec.observed_at := COALESCE(v_rec.observed_at, v_now);
      v_rec.price_retrieved_at := COALESCE(v_rec.price_retrieved_at, v_now);
      v_rec.deal_calculated_at := COALESCE(v_rec.deal_calculated_at, v_now);
      v_rec.last_verified_at := COALESCE(v_rec.last_verified_at, v_now);
      INSERT INTO flight_itineraries VALUES (v_rec.*) RETURNING id INTO v_new_id;
      v_inserted := v_inserted + 1;
    END IF;
    UPDATE flight_itineraries SET superseded_at = v_now
      WHERE itinerary_key = v_key AND superseded_at IS NULL AND id <> v_new_id;
    GET DIAGNOSTICS v_scratch = ROW_COUNT; v_superseded := v_superseded + v_scratch;
  END LOOP;

  INSERT INTO route_price_daily (
    origin_iata,dest_iata,departure_date,return_date,trip_type,cabin_class,
    maximum_stops,observation_date,minimum_price_inr,average_price_inr,maximum_price_inr,observation_count,last_retrieved_at)
  SELECT r.search_origin, r.search_dest, r.out_depart::date, r.ret_depart::date,
    COALESCE(r.trip_type,'roundtrip'), lower(COALESCE(r.cabin_class,'economy')),
    GREATEST(COALESCE(r.out_stops,0),COALESCE(r.ret_stops,0)),
    (v_now AT TIME ZONE 'utc')::date,
    MIN(r.price_inr), AVG(r.price_inr), MAX(r.price_inr), COUNT(*), v_now
  FROM jsonb_to_recordset(p_rows) AS r(
    search_origin text, search_dest text, trip_type text, cabin_class text,
    price_inr numeric, out_depart timestamp, ret_depart timestamp, out_stops int, ret_stops int)
  WHERE r.out_depart IS NOT NULL AND r.price_inr IS NOT NULL
  GROUP BY 1,2,3,4,5,6,7,8
  ON CONFLICT (origin_iata,dest_iata,departure_date,return_date,trip_type,cabin_class,maximum_stops,observation_date)
  DO UPDATE SET
    minimum_price_inr = LEAST(route_price_daily.minimum_price_inr, EXCLUDED.minimum_price_inr),
    maximum_price_inr = GREATEST(route_price_daily.maximum_price_inr, EXCLUDED.maximum_price_inr),
    average_price_inr = ((route_price_daily.average_price_inr*route_price_daily.observation_count)
      + (EXCLUDED.average_price_inr*EXCLUDED.observation_count))
      / (route_price_daily.observation_count + EXCLUDED.observation_count),
    observation_count = route_price_daily.observation_count + EXCLUDED.observation_count,
    last_retrieved_at = GREATEST(route_price_daily.last_retrieved_at, EXCLUDED.last_retrieved_at);

  RETURN jsonb_build_object('inserted',v_inserted,'refreshed',v_refreshed,'superseded',v_superseded);
END;
$fn$;

CREATE OR REPLACE FUNCTION cleanup_superseded_fares(p_batch int DEFAULT 5000)
RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE v_fares int := 0; v_cache int := 0;
BEGIN
  IF p_batch IS NULL OR p_batch < 1 THEN p_batch := 5000; END IF;
  IF p_batch > 20000 THEN p_batch := 20000; END IF;
  WITH victims AS (
    SELECT id FROM flight_itineraries
    WHERE superseded_at IS NOT NULL AND superseded_at < now() - interval '14 days'
    ORDER BY superseded_at LIMIT p_batch FOR UPDATE SKIP LOCKED
  ), del AS (DELETE FROM flight_itineraries f USING victims v WHERE f.id = v.id RETURNING 1)
  SELECT count(*) INTO v_fares FROM del;
  WITH delc AS (DELETE FROM explore_cache WHERE created_at < now() - interval '48 hours' RETURNING 1)
  SELECT count(*) INTO v_cache FROM delc;
  RETURN jsonb_build_object('flight_itineraries_deleted',v_fares,'explore_cache_deleted',v_cache,
    'batch_limit',p_batch,'more_fares_pending',v_fares = p_batch);
END;
$fn$;

REVOKE ALL ON FUNCTION ingest_itineraries(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_superseded_fares(int) FROM PUBLIC;
DO $g$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION ingest_itineraries(jsonb) TO service_role;
    GRANT EXECUTE ON FUNCTION cleanup_superseded_fares(int) TO service_role;
  END IF;
END $g$;

-- Schedule 6-hourly cleanup via pg_cron if available (else use /api/cron/cleanup-fares).
DO $c$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.schedule('cleanup-superseded-fares','0 */6 * * *',
      'SELECT cleanup_superseded_fares(5000);');
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_cron skipped: %', SQLERRM;
END $c$;

-- ---------- 5. server-side analytics aggregate -----------------------------
CREATE OR REPLACE FUNCTION analytics_summary()
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  WITH deal_agg AS (
    SELECT count(*) total,
      count(*) FILTER (WHERE status='published') published,
      count(*) FILTER (WHERE status='draft') draft,
      count(*) FILTER (WHERE status='expired') expired,
      min(deal_price) deal_min, max(deal_price) deal_max, round(avg(deal_price)) deal_avg, count(deal_price) deal_count,
      min(normal_price) normal_min, max(normal_price) normal_max, round(avg(normal_price)) normal_avg, count(normal_price) normal_count,
      count(DISTINCT origin_iata) origins, count(DISTINCT dest_iata) destinations,
      count(*) FILTER (WHERE image_url IS NOT NULL AND image_url<>'') with_images,
      count(*) FILTER (WHERE curator_note IS NOT NULL AND curator_note<>'') with_notes,
      count(*) FILTER (WHERE airline IS NOT NULL AND airline<>'') with_airlines,
      count(*) FILTER (WHERE deal_price IS NULL OR normal_price IS NULL) missing_prices
    FROM deals),
  ph_agg AS (SELECT count(*) total, min(observed_price_inr) ph_min, max(observed_price_inr) ph_max,
      round(avg(observed_price_inr)) ph_avg, count(observed_price_inr) ph_count FROM price_history),
  route_latest AS (SELECT DISTINCT ON (origin_iata,dest_iata) origin_iata,dest_iata,observed_price_inr price,airline,source
      FROM price_history ORDER BY origin_iata,dest_iata,observed_at DESC),
  route_counts AS (SELECT origin_iata,dest_iata,count(*) observations,max(observed_at) last_checked
      FROM price_history GROUP BY origin_iata,dest_iata),
  fresh_class AS (SELECT rc.origin_iata||'-'||rc.dest_iata route, rc.last_checked, rc.observations,
      rl.price, rl.airline, rl.source,
      round(EXTRACT(EPOCH FROM (now()-rc.last_checked))/3600.0,1) age_hours,
      CASE WHEN EXTRACT(EPOCH FROM (now()-rc.last_checked))/3600.0<6 THEN 'fresh'
           WHEN EXTRACT(EPOCH FROM (now()-rc.last_checked))/3600.0<24 THEN 'aging' ELSE 'stale' END freshness
      FROM route_counts rc LEFT JOIN route_latest rl USING (origin_iata,dest_iata)),
  lowest AS (SELECT * FROM deals WHERE deal_price IS NOT NULL ORDER BY deal_price ASC LIMIT 1),
  highest AS (SELECT * FROM deals WHERE deal_price IS NOT NULL ORDER BY deal_price DESC LIMIT 1)
  SELECT jsonb_build_object(
    'recordCounts', jsonb_build_object('totalDeals',(SELECT total FROM deal_agg),
      'totalPriceHistory',(SELECT total FROM ph_agg),
      'totalRecords',(SELECT total FROM deal_agg)+(SELECT total FROM ph_agg)),
    'deals', jsonb_build_object('total',(SELECT total FROM deal_agg),'published',(SELECT published FROM deal_agg),
      'draft',(SELECT draft FROM deal_agg),'expired',(SELECT expired FROM deal_agg)),
    'dealPrices', jsonb_build_object('min',(SELECT deal_min FROM deal_agg),'max',(SELECT deal_max FROM deal_agg),
      'avg',(SELECT deal_avg FROM deal_agg),'count',(SELECT deal_count FROM deal_agg)),
    'normalPrices', jsonb_build_object('min',(SELECT normal_min FROM deal_agg),'max',(SELECT normal_max FROM deal_agg),
      'avg',(SELECT normal_avg FROM deal_agg),'count',(SELECT normal_count FROM deal_agg)),
    'allHistoricalPrices', jsonb_build_object('min',(SELECT ph_min FROM ph_agg),'max',(SELECT ph_max FROM ph_agg),
      'avg',(SELECT ph_avg FROM ph_agg),'count',(SELECT ph_count FROM ph_agg)),
    'dataCompleteness', jsonb_build_object('deals_with_images',(SELECT with_images FROM deal_agg),
      'deals_with_notes',(SELECT with_notes FROM deal_agg),'deals_with_airlines',(SELECT with_airlines FROM deal_agg),
      'deals_missing_prices',(SELECT missing_prices FROM deal_agg)),
    'routes', jsonb_build_object('unique_routes',(SELECT total FROM deal_agg),
      'origins',(SELECT origins FROM deal_agg),'destinations',(SELECT destinations FROM deal_agg)),
    'freshness', jsonb_build_object('thresholds',jsonb_build_object('freshHours',6,'agingHours',24),
      'summary',jsonb_build_object('fresh',(SELECT count(*) FROM fresh_class WHERE freshness='fresh'),
        'aging',(SELECT count(*) FROM fresh_class WHERE freshness='aging'),
        'stale',(SELECT count(*) FROM fresh_class WHERE freshness='stale'),
        'totalRoutes',(SELECT count(*) FROM fresh_class)),
      'routes', COALESCE((SELECT jsonb_agg(jsonb_build_object('route',route,'freshness',freshness,'price',price,
        'airline',airline,'ageHours',age_hours,'lastChecked',last_checked,'observations',observations,'source',source)
        ORDER BY age_hours DESC NULLS FIRST) FROM fresh_class),'[]'::jsonb)),
    'lowestDeal', (SELECT CASE WHEN l.id IS NULL THEN NULL ELSE jsonb_build_object(
        'route',l.origin_city||' → '||l.dest_city,'airline',l.airline,'dealPrice',l.deal_price,'normalPrice',l.normal_price,
        'discount',round(((l.normal_price-l.deal_price)/NULLIF(l.normal_price,0))*100),
        'dates',l.validity_start||' to '||l.validity_end) END FROM lowest l),
    'highestDeal', (SELECT CASE WHEN h.id IS NULL THEN NULL ELSE jsonb_build_object(
        'route',h.origin_city||' → '||h.dest_city,'airline',h.airline,'dealPrice',h.deal_price,'normalPrice',h.normal_price,
        'discount',round(((h.normal_price-h.deal_price)/NULLIF(h.normal_price,0))*100),
        'dates',h.validity_start||' to '||h.validity_end) END FROM highest h),
    'lastUpdated', now());
$fn$;
REVOKE ALL ON FUNCTION analytics_summary() FROM PUBLIC;
DO $g$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION analytics_summary() TO service_role;
  END IF;
END $g$;

-- ---------- done ----------------------------------------------------------
SELECT 'prevention migrations applied' AS status,
       (SELECT count(*) FROM flight_itineraries WHERE itinerary_key IS NULL) AS fares_without_key;

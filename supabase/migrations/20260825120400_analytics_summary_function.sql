-- ============================================================================
-- Phase 7 support: server-side analytics aggregation
-- ============================================================================
-- Replaces the old "download every deal + every price_history row into Node and
-- reduce() in JS" pattern with a single set of Postgres aggregates. The route
-- calls this RPC (with a short in-memory TTL cache) instead of full-table scans.
-- Returns a shape compatible with src/app/admin/data/page.tsx.
-- ============================================================================

CREATE OR REPLACE FUNCTION analytics_summary()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  WITH deal_agg AS (
    SELECT
      count(*)                                                    AS total,
      count(*) FILTER (WHERE status = 'published')                AS published,
      count(*) FILTER (WHERE status = 'draft')                    AS draft,
      count(*) FILTER (WHERE status = 'expired')                  AS expired,
      min(deal_price)                                             AS deal_min,
      max(deal_price)                                             AS deal_max,
      round(avg(deal_price))                                      AS deal_avg,
      count(deal_price)                                           AS deal_count,
      min(normal_price)                                           AS normal_min,
      max(normal_price)                                           AS normal_max,
      round(avg(normal_price))                                    AS normal_avg,
      count(normal_price)                                         AS normal_count,
      count(DISTINCT origin_iata)                                 AS origins,
      count(DISTINCT dest_iata)                                   AS destinations,
      count(*) FILTER (WHERE image_url IS NOT NULL AND image_url <> '')       AS with_images,
      count(*) FILTER (WHERE curator_note IS NOT NULL AND curator_note <> '') AS with_notes,
      count(*) FILTER (WHERE airline IS NOT NULL AND airline <> '')           AS with_airlines,
      count(*) FILTER (WHERE deal_price IS NULL OR normal_price IS NULL)      AS missing_prices
    FROM deals
  ),
  ph_agg AS (
    SELECT
      count(*)                        AS total,
      min(observed_price_inr)         AS ph_min,
      max(observed_price_inr)         AS ph_max,
      round(avg(observed_price_inr))  AS ph_avg,
      count(observed_price_inr)       AS ph_count
    FROM price_history
  ),
  route_latest AS (
    SELECT DISTINCT ON (origin_iata, dest_iata)
      origin_iata, dest_iata,
      observed_price_inr AS price, airline, source
    FROM price_history
    ORDER BY origin_iata, dest_iata, observed_at DESC
  ),
  route_counts AS (
    SELECT origin_iata, dest_iata, count(*) AS observations, max(observed_at) AS last_checked
    FROM price_history
    GROUP BY origin_iata, dest_iata
  ),
  fresh_class AS (
    SELECT
      rc.origin_iata || '-' || rc.dest_iata                                    AS route,
      rc.last_checked, rc.observations,
      rl.price, rl.airline, rl.source,
      round(EXTRACT(EPOCH FROM (now() - rc.last_checked)) / 3600.0, 1)          AS age_hours,
      CASE WHEN EXTRACT(EPOCH FROM (now() - rc.last_checked)) / 3600.0 < 6  THEN 'fresh'
           WHEN EXTRACT(EPOCH FROM (now() - rc.last_checked)) / 3600.0 < 24 THEN 'aging'
           ELSE 'stale' END                                                     AS freshness
    FROM route_counts rc
    LEFT JOIN route_latest rl USING (origin_iata, dest_iata)
  ),
  lowest AS (SELECT * FROM deals WHERE deal_price IS NOT NULL ORDER BY deal_price ASC  LIMIT 1),
  highest AS (SELECT * FROM deals WHERE deal_price IS NOT NULL ORDER BY deal_price DESC LIMIT 1)
  SELECT jsonb_build_object(
    'recordCounts', jsonb_build_object(
      'totalDeals', (SELECT total FROM deal_agg),
      'totalPriceHistory', (SELECT total FROM ph_agg),
      'totalRecords', (SELECT total FROM deal_agg) + (SELECT total FROM ph_agg)
    ),
    'deals', jsonb_build_object(
      'total', (SELECT total FROM deal_agg), 'published', (SELECT published FROM deal_agg),
      'draft', (SELECT draft FROM deal_agg), 'expired', (SELECT expired FROM deal_agg)
    ),
    'dealPrices', jsonb_build_object(
      'min', (SELECT deal_min FROM deal_agg), 'max', (SELECT deal_max FROM deal_agg),
      'avg', (SELECT deal_avg FROM deal_agg), 'count', (SELECT deal_count FROM deal_agg)
    ),
    'normalPrices', jsonb_build_object(
      'min', (SELECT normal_min FROM deal_agg), 'max', (SELECT normal_max FROM deal_agg),
      'avg', (SELECT normal_avg FROM deal_agg), 'count', (SELECT normal_count FROM deal_agg)
    ),
    'allHistoricalPrices', jsonb_build_object(
      'min', (SELECT ph_min FROM ph_agg), 'max', (SELECT ph_max FROM ph_agg),
      'avg', (SELECT ph_avg FROM ph_agg), 'count', (SELECT ph_count FROM ph_agg)
    ),
    'dataCompleteness', jsonb_build_object(
      'deals_with_images', (SELECT with_images FROM deal_agg),
      'deals_with_notes', (SELECT with_notes FROM deal_agg),
      'deals_with_airlines', (SELECT with_airlines FROM deal_agg),
      'deals_missing_prices', (SELECT missing_prices FROM deal_agg)
    ),
    'routes', jsonb_build_object(
      'unique_routes', (SELECT total FROM deal_agg),
      'origins', (SELECT origins FROM deal_agg),
      'destinations', (SELECT destinations FROM deal_agg)
    ),
    'freshness', jsonb_build_object(
      'thresholds', jsonb_build_object('freshHours', 6, 'agingHours', 24),
      'summary', jsonb_build_object(
        'fresh', (SELECT count(*) FROM fresh_class WHERE freshness = 'fresh'),
        'aging', (SELECT count(*) FROM fresh_class WHERE freshness = 'aging'),
        'stale', (SELECT count(*) FROM fresh_class WHERE freshness = 'stale'),
        'totalRoutes', (SELECT count(*) FROM fresh_class)
      ),
      'routes', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'route', route, 'freshness', freshness, 'price', price, 'airline', airline,
          'ageHours', age_hours, 'lastChecked', last_checked, 'observations', observations,
          'source', source
        ) ORDER BY age_hours DESC NULLS FIRST)
        FROM fresh_class
      ), '[]'::jsonb)
    ),
    'lowestDeal', (SELECT CASE WHEN l.id IS NULL THEN NULL ELSE jsonb_build_object(
        'route', l.origin_city || ' → ' || l.dest_city, 'airline', l.airline,
        'dealPrice', l.deal_price, 'normalPrice', l.normal_price,
        'discount', round(((l.normal_price - l.deal_price) / NULLIF(l.normal_price, 0)) * 100),
        'dates', l.validity_start || ' to ' || l.validity_end
      ) END FROM lowest l),
    'highestDeal', (SELECT CASE WHEN h.id IS NULL THEN NULL ELSE jsonb_build_object(
        'route', h.origin_city || ' → ' || h.dest_city, 'airline', h.airline,
        'dealPrice', h.deal_price, 'normalPrice', h.normal_price,
        'discount', round(((h.normal_price - h.deal_price) / NULLIF(h.normal_price, 0)) * 100),
        'dates', h.validity_start || ' to ' || h.validity_end
      ) END FROM highest h),
    'lastUpdated', now()
  );
$$;

-- Aggregates only (no row data) but still server-side; keep it off the public
-- PostgREST surface. The /api/analytics route calls it with the service role.
REVOKE ALL ON FUNCTION analytics_summary() FROM PUBLIC;
DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION analytics_summary() TO service_role;
  END IF;
END
$grant$;

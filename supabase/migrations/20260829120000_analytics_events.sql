-- ============================================================================
-- First-party product analytics: impressions, clicks, page dwell, checkout funnel
-- ----------------------------------------------------------------------------
-- One append-only event table (analytics_events) feeds every question:
--   1. impression share per deal      -> analytics_deal_performance()
--   2. time spent per page            -> analytics_page_dwell()
--   3. reached-payment-but-didn't-pay -> analytics_checkout_funnel()
--   4. first deal/carousel clicked    -> analytics_first_deal_click()
--   5. ad/affiliate monetisation data -> analytics_deal_performance() (CTR + share)
-- Writes go through the service role only (RLS on, no public policy). Resilient
-- by design: no FKs, nullable columns, so a bad/late event never blocks ingest.
-- Paste-safe for the Supabase SQL editor (no CONCURRENTLY; table starts empty).
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,          -- impression | click | page_view | checkout_started | payment_success | checkout_abandoned | checkout_failed
  user_id     uuid,                   -- null for logged-out visitors
  anon_id     text,                   -- stable per-browser id, groups pre-login activity
  deal_id     uuid,                   -- set for impression / click
  surface     text,                   -- hero | carousel | grid | spotlight | pricing
  position    int,                    -- slot index within the surface (0-based)
  page        text,                   -- pathname for context / page_view
  dwell_ms    integer,                -- time-on-page for page_view
  tier        text,                   -- silver | gold for checkout events
  meta        jsonb,                  -- freeform: { annual, cycle, error, locked, ... }
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_deal_idx      ON analytics_events (deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_user_idx      ON analytics_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_page_idx      ON analytics_events (page)    WHERE event_type = 'page_view';

-- Lock the table down: only the service role (which bypasses RLS) can read/write.
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ---------- 1 + 5. impression share + CTR per deal --------------------------
CREATE OR REPLACE FUNCTION analytics_deal_performance(p_days int DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  WITH ev AS (
    SELECT deal_id, event_type
    FROM analytics_events
    WHERE deal_id IS NOT NULL
      AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND event_type IN ('impression','click')
  ),
  per_deal AS (
    SELECT deal_id,
      count(*) FILTER (WHERE event_type='impression') AS impressions,
      count(*) FILTER (WHERE event_type='click')      AS clicks
    FROM ev GROUP BY deal_id
  ),
  totals AS (SELECT COALESCE(sum(impressions),0) AS all_impr FROM per_deal)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'deal_id', p.deal_id,
      'route', d.origin_city || ' → ' || d.dest_city,
      'airline', d.airline,
      'impressions', p.impressions,
      'clicks', p.clicks,
      'ctr_pct', round((p.clicks::numeric / NULLIF(p.impressions,0)) * 100, 2),
      'impression_share_pct', round((p.impressions::numeric / NULLIF((SELECT all_impr FROM totals),0)) * 100, 2)
    ) ORDER BY p.impressions DESC), '[]'::jsonb)
  FROM per_deal p LEFT JOIN deals d ON d.id = p.deal_id;
$fn$;

-- ---------- 2. time spent per page ------------------------------------------
CREATE OR REPLACE FUNCTION analytics_page_dwell(p_days int DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'page', page,
      'views', views,
      'avg_seconds', round(avg_ms / 1000.0, 1),
      'total_minutes', round(total_ms / 60000.0, 1)
    ) ORDER BY total_ms DESC), '[]'::jsonb)
  FROM (
    SELECT page,
      count(*) AS views,
      avg(dwell_ms) AS avg_ms,
      sum(dwell_ms) AS total_ms
    FROM analytics_events
    WHERE event_type = 'page_view' AND page IS NOT NULL AND dwell_ms IS NOT NULL
      AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY page
  ) t;
$fn$;

-- ---------- 3. checkout funnel (reached payment vs paid) --------------------
CREATE OR REPLACE FUNCTION analytics_checkout_funnel(p_days int DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  WITH c AS (
    SELECT
      count(*) FILTER (WHERE event_type='checkout_started')   AS started,
      count(*) FILTER (WHERE event_type='payment_success')    AS paid,
      count(*) FILTER (WHERE event_type='checkout_abandoned') AS abandoned,
      count(*) FILTER (WHERE event_type='checkout_failed')    AS failed
    FROM analytics_events
    WHERE created_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND event_type IN ('checkout_started','payment_success','checkout_abandoned','checkout_failed')
  )
  SELECT jsonb_build_object(
    'reached_payment', started,
    'paid', paid,
    'abandoned', abandoned,
    'failed', failed,
    'reached_but_not_paid', GREATEST(started - paid, 0),
    'conversion_pct', round((paid::numeric / NULLIF(started,0)) * 100, 2),
    'abandonment_pct', round(((started - paid)::numeric / NULLIF(started,0)) * 100, 2)
  ) FROM c;
$fn$;

-- ---------- 4. first deal/carousel each user clicked ------------------------
CREATE OR REPLACE FUNCTION analytics_first_deal_click(p_days int DEFAULT 90)
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'actor', COALESCE(user_id::text, 'anon:' || anon_id),
      'deal_id', deal_id,
      'route', d.origin_city || ' → ' || d.dest_city,
      'surface', surface,
      'position', position,
      'clicked_at', clicked_at
    ) ORDER BY clicked_at DESC), '[]'::jsonb)
  FROM (
    SELECT DISTINCT ON (COALESCE(user_id::text, 'anon:' || anon_id))
      user_id, anon_id, deal_id, surface, position, created_at AS clicked_at
    FROM analytics_events
    WHERE event_type = 'click' AND deal_id IS NOT NULL
      AND (user_id IS NOT NULL OR anon_id IS NOT NULL)
      AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    ORDER BY COALESCE(user_id::text, 'anon:' || anon_id), created_at ASC
  ) f LEFT JOIN deals d ON d.id = f.deal_id;
$fn$;

REVOKE ALL ON FUNCTION analytics_deal_performance(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION analytics_page_dwell(int)       FROM PUBLIC;
REVOKE ALL ON FUNCTION analytics_checkout_funnel(int)  FROM PUBLIC;
REVOKE ALL ON FUNCTION analytics_first_deal_click(int) FROM PUBLIC;
DO $g$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION analytics_deal_performance(int) TO service_role;
    GRANT EXECUTE ON FUNCTION analytics_page_dwell(int)       TO service_role;
    GRANT EXECUTE ON FUNCTION analytics_checkout_funnel(int)  TO service_role;
    GRANT EXECUTE ON FUNCTION analytics_first_deal_click(int) TO service_role;
  END IF;
END $g$;

SELECT 'analytics_events migration applied' AS status;

-- ============================================================================
-- PHASE 10 — PRODUCTION CLEANUP RUNBOOK  (⚠️ GATED — do NOT run without approval)
-- ============================================================================
-- This file is NOT a migration and is NOT applied automatically. Run each STEP
-- manually in the Supabase SQL editor, in order, watching CPU + locks between
-- steps. Every destructive step is called out. Take a backup FIRST (STEP 0).
--
-- Context (measured 2026-08-25):
--   flight_itineraries = 1,220,402 rows (≈ the entire 0.774 GB DB).
--   Every row is > 48h old (ingestion stopped); dedupe_key baked in price+day
--   so the table is mostly re-priced duplicates of a much smaller set of
--   logical itineraries. Collapsing to newest-per-itinerary_key is the win.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 0 — BACKUP (do this before anything else)
-- ─────────────────────────────────────────────────────────────────────────
-- Do NOT `CREATE TABLE ... AS SELECT *` inside this DB — it would double the
-- size on an already over-quota project. Back up EXTERNALLY:
--
--   # direct connection string: Supabase Dashboard → Project Settings → Database
--   pg_dump "postgresql://postgres:[PW]@db.<ref>.supabase.co:5432/postgres" \
--     -t public.flight_itineraries -Fc -f flight_itineraries_20260825.dump
--
--   # (deals + price_history are tiny and also covered by the admin CSV export:
--   #  GET /api/analytics/export  with the x-admin-token header)
--
-- If the project is in read-only mode (over the 0.5 GB Free cap), Supabase may
-- refuse writes. In that case upgrade to Pro TEMPORARILY for headroom before
-- STEP 3+ (delete + VACUUM need working space), then downgrade after.


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1 — APPLY MIGRATIONS (non-destructive)
-- ─────────────────────────────────────────────────────────────────────────
-- Apply, in order, everything in supabase/migrations/ EXCEPT the partial-unique
-- index (that is STEP 4). i.e. run:
--   20260825120000_add_fare_timestamps_and_itinerary_key.sql
--   20260825120100_explore_cache_and_route_price_daily.sql
--   20260825120200_performance_indexes.sql   (leave fi_itinerary_key_current UNIQUE for STEP 4)
--   20260825120300_ingest_and_cleanup_functions.sql
--   20260825120400_analytics_summary_function.sql


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2 — BACKFILL itinerary_key + timestamps (batched, safe to repeat)
-- ─────────────────────────────────────────────────────────────────────────
-- Run repeatedly until it returns 0. Each call updates up to 5,000 rows.
--   SELECT backfill_fi_identity(5000);
-- Or drain in one session:
--   DO $$ DECLARE n int; BEGIN LOOP n := backfill_fi_identity(5000);
--     RAISE NOTICE 'backfilled %', n; EXIT WHEN n = 0; END LOOP; END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3 — REPORT retention impact (READ-ONLY — share output before deleting)
-- ─────────────────────────────────────────────────────────────────────────
SELECT
  count(*)                                       AS total_rows,
  count(*) FILTER (WHERE itinerary_key IS NULL)  AS not_yet_backfilled,
  count(DISTINCT itinerary_key)                  AS distinct_itineraries_kept,
  count(*) - count(DISTINCT itinerary_key)       AS duplicates_to_delete
FROM flight_itineraries;
-- ⛔ APPROVAL GATE: stop and share these numbers before running STEP 3b.


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3b — DELETE duplicates, keep newest per itinerary_key (⚠️ DESTRUCTIVE)
-- ─────────────────────────────────────────────────────────────────────────
-- Batched (5,000/iteration). Keeps exactly ONE row per itinerary_key — the most
-- recently observed — even if it is old. NEVER touches deals/users/etc.
-- Run repeatedly until 0 rows deleted; watch CPU/locks between batches.
--
--   WITH ranked AS (
--     SELECT id, row_number() OVER (
--       PARTITION BY itinerary_key ORDER BY observed_at DESC NULLS LAST, id
--     ) AS rn
--     FROM flight_itineraries
--     WHERE itinerary_key IS NOT NULL
--   ),
--   victims AS (SELECT id FROM ranked WHERE rn > 1 LIMIT 5000)
--   DELETE FROM flight_itineraries f USING victims v WHERE f.id = v.id;
--
-- Loop form:
--   DO $$ DECLARE n int; BEGIN LOOP
--     WITH ranked AS (
--       SELECT id, row_number() OVER (PARTITION BY itinerary_key ORDER BY observed_at DESC NULLS LAST, id) rn
--       FROM flight_itineraries WHERE itinerary_key IS NOT NULL),
--     victims AS (SELECT id FROM ranked WHERE rn > 1 LIMIT 5000),
--     del AS (DELETE FROM flight_itineraries f USING victims v WHERE f.id = v.id RETURNING 1)
--     SELECT count(*) INTO n FROM del;
--     RAISE NOTICE 'deleted %', n; EXIT WHEN n = 0;
--   END LOOP; END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4 — enforce one-current-row-per-key (after STEP 3b collapses dupes)
-- ─────────────────────────────────────────────────────────────────────────
-- Now safe because at most one non-superseded row exists per itinerary_key.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS fi_itinerary_key_current_uidx
  ON flight_itineraries (itinerary_key)
  WHERE superseded_at IS NULL;
-- Optionally drop the now-redundant non-unique version + legacy indexes:
--   DROP INDEX IF EXISTS fi_itinerary_key_current_idx;
--   DROP INDEX IF EXISTS idx_fi_route;
--   DROP INDEX IF EXISTS idx_fi_price;
--   DROP INDEX IF EXISTS idx_fi_stops;
-- Optionally reclaim the large legacy UNIQUE(dedupe_key) once the new code is live:
--   ALTER TABLE flight_itineraries DROP CONSTRAINT IF EXISTS flight_itineraries_dedupe_key_key;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 5 — reclaim space
-- ─────────────────────────────────────────────────────────────────────────
VACUUM (ANALYZE) flight_itineraries;
-- Check physical size:
SELECT pg_size_pretty(pg_total_relation_size('flight_itineraries')) AS total,
       pg_size_pretty(pg_relation_size('flight_itineraries'))       AS heap,
       pg_size_pretty(pg_indexes_size('flight_itineraries'))        AS indexes;
-- If size is still not reduced enough, VACUUM FULL rewrites the table and needs
-- free disk ≥ current table size + downtime. ONLY during an agreed window:
--   VACUUM FULL flight_itineraries;   -- ⚠️ takes an exclusive lock


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 6 — ongoing retention (already automated)
-- ─────────────────────────────────────────────────────────────────────────
-- From here, ingest_itineraries() supersedes re-priced rows and
-- cleanup_superseded_fares() (pg_cron every 6h, or /api/cron/cleanup-fares)
-- deletes them 48h later. No manual step needed.

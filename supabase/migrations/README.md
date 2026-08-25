# Supabase migrations — Supabase performance & 48h retention

Apply in filename order. All migrations here are **non-destructive** (add columns,
functions, indexes; the only inline data change is a ~113-row backfill of `deals`).
The heavy work against `flight_itineraries` (1.2M rows) is deliberately deferred to
the **gated** `../phase10_cleanup_runbook.sql`.

| File | Phase | What it does | Destructive? |
|------|-------|--------------|--------------|
| `20260825120000_add_fare_timestamps_and_itinerary_key.sql` | 2 | `price_retrieved_at`/`deal_calculated_at`/`last_verified_at`/`superseded_at`/`itinerary_key` on `flight_itineraries`; timestamps on `deals`; `fi_itinerary_key()`; batched `backfill_fi_identity()` | No |
| `20260825120100_explore_cache_and_route_price_daily.sql` | 4 | unique `explore_cache.cache_key` + cleanup index; new `route_price_daily` summary table | De-dupes `explore_cache` only |
| `20260825120200_performance_indexes.sql` | 6 | partial indexes for current-fare lookup, itinerary_key, superseded cleanup; `price_history`/`route_prices` route indexes | No |
| `20260825120300_ingest_and_cleanup_functions.sql` | 3+5 | `ingest_itineraries()` (transactional insert→supersede + daily rollup), `cleanup_superseded_fares()`, pg_cron schedule if available | No (functions only) |
| `20260825120400_analytics_summary_function.sql` | 7 | `analytics_summary()` server-side aggregates | No |

## Ordering notes
- The **partial UNIQUE** index on `itinerary_key WHERE superseded_at IS NULL` is **not**
  in `120200`. It can only be created after existing duplicates are collapsed
  (today every historical row is non-superseded). It is **STEP 4** of the runbook.
- `ingest_itineraries()` is self-healing: it supersedes stray duplicate "current"
  rows per key even before that unique index exists.
- `CREATE INDEX CONCURRENTLY` can't run inside a transaction — apply via the SQL
  editor (autocommit). Drop `CONCURRENTLY` if wrapping in an explicit transaction.

## Validation
Migration SQL (esp. the plpgsql in `120300`) was written and reviewed but **not
executed** in this environment (no Postgres available). Apply + smoke-test in a
staging project or the SQL editor before production. The TypeScript ingest/retention
logic is covered by `npm test`.

## After migrating
Follow `../phase10_cleanup_runbook.sql` (backup → backfill → report → gated delete →
unique index → VACUUM) to reclaim the space. Do not run its destructive steps
without sign-off.

/**
 * Retention cleanup fallback (used only when Supabase pg_cron is unavailable).
 *
 * Calls cleanup_superseded_fares() which deletes, in controlled batches:
 *   - flight_itineraries superseded > 14 days ago
 *   - explore_cache older than 48h
 * It never touches deals, users, subscriptions, alerts, notifications, or
 * route_price_daily. Protected by CRON_SECRET — NOT publicly executable.
 *
 * Do NOT enable this AND the pg_cron schedule at the same time.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCronSecret } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH = 5000
const MAX_BATCHES_PER_RUN = 4 // bound work per invocation to avoid long locks/CPU

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const started = Date.now()
  let totalFares = 0
  let totalCache = 0
  let batches = 0

  for (let i = 0; i < MAX_BATCHES_PER_RUN; i++) {
    const { data, error } = await supabaseAdmin.rpc('cleanup_superseded_fares', { p_batch: BATCH })
    if (error) {
      return NextResponse.json({ error: error.message, batches, totalFares, totalCache }, { status: 500 })
    }
    const res = (data ?? {}) as {
      flight_itineraries_deleted?: number
      explore_cache_deleted?: number
      more_fares_pending?: boolean
    }
    totalFares += res.flight_itineraries_deleted ?? 0
    totalCache += res.explore_cache_deleted ?? 0
    batches++
    if (!res.more_fares_pending) break
  }

  return NextResponse.json({
    ok: true,
    flight_itineraries_deleted: totalFares,
    explore_cache_deleted: totalCache,
    batches,
    more_pending: batches === MAX_BATCHES_PER_RUN,
    duration_ms: Date.now() - started,
  })
}

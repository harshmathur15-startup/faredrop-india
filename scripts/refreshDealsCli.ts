/**
 * Standalone daily deal-refresh runner — invoked by GitHub Actions
 * (.github/workflows/refresh-deals.yml), NOT by Vercel.
 *
 * Runs the exact same `refreshLiveDeals` logic as /api/cron/refresh-deals, but
 * with no serverless timeout. The Vercel Hobby cron was being killed at its 60s
 * function ceiling because the FlightAPI fetch phase for ~80 deals takes
 * 100-280s, so the whole run (and its deal_refresh_runs record) was silently
 * lost on slow-API mornings. GitHub Actions has no such limit.
 *
 * Exits non-zero on failure so CI marks the run red and emails the owner.
 *
 * Required env (GitHub repo secrets):
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, FLIGHTAPI_KEY
 * Optional: RESEND_API_KEY (+ RESEND_FROM_EMAIL, REFRESH_SUMMARY_EMAIL) for the summary email.
 */
import { createClient } from '@supabase/supabase-js'
import { refreshLiveDeals } from '@/lib/refreshDeals'
import { sendRefreshSummaryEmail } from '@/lib/email'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiKey = process.env.FLIGHTAPI_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!apiKey) {
  console.error('Missing FLIGHTAPI_KEY')
  process.exit(1)
}

// supabase-js initialises a realtime client in its constructor, which looks for
// a global WebSocket. Node < 22 (GitHub Actions default) has none, and we never
// use realtime here (table operations only) — so install a harmless stub to
// avoid "Node.js detected but native WebSocket not found".
const g = globalThis as { WebSocket?: unknown }
if (typeof g.WebSocket === 'undefined') {
  g.WebSocket = class {}
}

const supabaseAdmin = createClient(url, key)
const SUMMARY_EMAIL = process.env.REFRESH_SUMMARY_EMAIL || 'travelbabyin@gmail.com'
const EXPIRE_PCT_THRESHOLD = 0.30
// We have ~20 concurrent FlightAPI capacity; 20 keeps a full run well under a
// couple of minutes (no timeout pressure on GitHub Actions).
const CONCURRENCY = 20

// Minimum gap between real refreshes. The 3 scheduled runs are >4h apart, so
// this never blocks them — it only skips a run that GitHub delayed into another
// run's slot, which would otherwise waste FlightAPI credits on a double refresh.
const MIN_GAP_MINUTES = 90

async function main() {
  const startedAt = Date.now()

  // Guard against back-to-back double refreshes (see MIN_GAP_MINUTES).
  const { data: lastRun } = await supabaseAdmin
    .from('deal_refresh_runs')
    .select('ran_at')
    .order('ran_at', { ascending: false })
    .limit(1)
  const lastRanAt = lastRun?.[0]?.ran_at ? new Date(lastRun[0].ran_at).getTime() : 0
  const minsSince = (Date.now() - lastRanAt) / 60000
  if (minsSince < MIN_GAP_MINUTES) {
    console.log(`Skipping: last refresh was ${minsSince.toFixed(0)} min ago (< ${MIN_GAP_MINUTES}-min guard).`)
    return
  }

  const summary = await refreshLiveDeals(supabaseAdmin, apiKey!, {
    expirePctThreshold: EXPIRE_PCT_THRESHOLD,
    concurrency: CONCURRENCY,
  })

  const { error: insErr } = await supabaseAdmin
    .from('deal_refresh_runs')
    .insert({ ran_at: summary.ran_at, summary })
  if (insErr) console.error('deal_refresh_runs insert failed:', insErr.message)
  else console.log('recorded deal_refresh_runs row for', summary.ran_at)

  console.log(
    `done in ${((Date.now() - startedAt) / 1000).toFixed(0)}s | ` +
      `refreshed:${summary.refreshed} up:${summary.increased} down:${summary.decreased} ` +
      `expired:${summary.expired} no_fare:${summary.no_fare} credits:${summary.credits_used} ` +
      `errors:${summary.errors.length}`,
  )

  if (process.env.RESEND_API_KEY) {
    try {
      await sendRefreshSummaryEmail({ to: SUMMARY_EMAIL, summary })
      console.log('summary email sent to', SUMMARY_EMAIL)
    } catch (e) {
      console.error('summary email failed (non-fatal):', String(e))
    }
  } else {
    console.log('RESEND_API_KEY not set — skipping summary email')
  }
}

main().catch((e) => {
  console.error('refresh run FAILED:', e)
  process.exit(1)
})

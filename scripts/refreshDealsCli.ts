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

const supabaseAdmin = createClient(url, key)
const SUMMARY_EMAIL = process.env.REFRESH_SUMMARY_EMAIL || 'harshmathur15@gmail.com'
const EXPIRE_PCT_THRESHOLD = 0.30
// We have ~20 concurrent FlightAPI capacity; 20 keeps a full run well under a
// couple of minutes (no timeout pressure on GitHub Actions).
const CONCURRENCY = 20

async function main() {
  const startedAt = Date.now()
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

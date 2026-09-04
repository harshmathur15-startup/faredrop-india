/**
 * Daily live-deal price refresh (Vercel cron — scheduled in vercel.json).
 *
 * Re-prices every published deal in its own cabin against today's cheapest
 * FlightAPI fare, bumps fare timestamps, and EXPIRES any deal whose new cheapest
 * is more than 30% above its stored deal_price. Persists a run summary to
 * deal_refresh_runs so /api/deal-refresh/latest (and the Claude routine) can
 * report what changed. Protected by CRON_SECRET — NOT publicly executable.
 *
 * Cost: ~2 FlightAPI credits per round-trip deal, ~1 per one-way (~70-80/day).
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCronSecret } from '@/lib/api-guard'
import { refreshLiveDeals } from '@/lib/refreshDeals'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // up to ~40 external FlightAPI calls per run

const EXPIRE_PCT_THRESHOLD = 0.30 // expire deals whose fare rose > 30%

async function run(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const apiKey = process.env.FLIGHTAPI_KEY
  if (!apiKey) return NextResponse.json({ error: 'FLIGHTAPI_KEY not configured' }, { status: 500 })

  try {
    const summary = await refreshLiveDeals(supabaseAdmin, apiKey, {
      expirePctThreshold: EXPIRE_PCT_THRESHOLD,
    })

    // Persist the run so the public summary endpoint + Claude routine can read it.
    const { error: insErr } = await supabaseAdmin
      .from('deal_refresh_runs')
      .insert({ ran_at: summary.ran_at, summary })
    if (insErr) console.error('deal_refresh_runs insert failed', insErr.message)

    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// Vercel Cron issues a GET with `Authorization: Bearer <CRON_SECRET>`.
export const GET = run
// POST allowed too (manual trigger with x-cron-secret).
export const POST = run

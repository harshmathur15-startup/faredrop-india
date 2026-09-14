/**
 * Daily deal-DISCOVERY agent (Vercel cron — scheduled in vercel.json).
 *
 * Scans a rotating subset of lanes (bounded ~300 FlightAPI credits/day), finds
 * the best qualifying fare per lane (nonstop or <=1 stop with every layover <8h,
 * and >=20% below the lane's typical price), dedups against live deals, and
 * AUTO-PUBLISHES them. Then emails a single "new deals" digest to confirmed
 * subscribers covering everything published in the last 24h (discovery + manual).
 * Protected by CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCronSecret } from '@/lib/api-guard'
import { discoverDeals } from '@/lib/discoverDeals'
import { sendDealDigestEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function run(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr
  const apiKey = process.env.FLIGHTAPI_KEY
  if (!apiKey) return NextResponse.json({ error: 'FLIGHTAPI_KEY not configured' }, { status: 500 })

  try {
    // 1. Discover + auto-publish
    const summary = await discoverDeals(supabaseAdmin, apiKey)

    // 2. Digest = everything published in the last ~24h (discovery + manual)
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { data: fresh } = await supabaseAdmin
      .from('deals')
      .select('id, origin_city, dest_city, airline, deal_price, normal_price, validity_start, validity_end')
      .eq('status', 'published')
      .gte('published_at', since)
      .order('deal_price', { ascending: true })

    // Subscriber broadcast is OFF until DEAL_DIGEST_ENABLED='true' is set in the
    // env — so no email reaches users until it's deliberately switched on (after
    // a sample has been reviewed). Discovery + auto-publish are unaffected.
    const digest = {
      enabled: process.env.DEAL_DIGEST_ENABLED === 'true',
      recipients: 0, sent: 0, failed: 0, deals: fresh?.length ?? 0,
    }
    if (digest.enabled && fresh && fresh.length) {
      const { data: subs } = await supabaseAdmin
        .from('subscribers').select('email').eq('confirmed', true)
      for (const s of subs ?? []) {
        digest.recipients++
        try { await sendDealDigestEmail({ to: s.email, deals: fresh }); digest.sent++ }
        catch { digest.failed++ }
      }
    }

    return NextResponse.json({ ok: true, discovery: summary, digest })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export const GET = run
export const POST = run

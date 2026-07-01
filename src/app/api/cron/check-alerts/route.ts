/**
 * Flight Alert Monitoring Engine
 *
 * Called by Vercel Cron every hour (see vercel.json).
 * For each active alert:
 *   1. Look up best current price (DB cache → live FlightAPI.io)
 *   2. If price ≤ target → "target_reached"
 *      If price dropped ≥ 15% since last check → "price_drop"
 *   3. Notify user via email + WhatsApp (rate-limited to once per 24 h per alert)
 *   4. Update last_checked_at, last_price_seen, triggered_count
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyPriceAlert } from '@/lib/notifications'

export const dynamic    = 'force-dynamic'
export const maxDuration = 60 // seconds (upgrade to Pro for 300 s)

const PRICE_DROP_THRESHOLD    = 0.85  // 15%+ drop triggers alert
const NOTIFY_COOLDOWN_HOURS   = 24    // minimum hours between notifications per alert
const BATCH_SIZE              = 50    // alerts processed per cron run
const CACHE_FRESH_HOURS       = 4     // hours before re-fetching live price
const LIVE_FETCH_DEPART_DAYS  = 30    // representative departure offset for live API call
const LIVE_FETCH_RETURN_DAYS  = 37    // representative return offset

// ── Price lookup ─────────────────────────────────────────────────────────────

async function getBestPrice(
  origin: string, dest: string, cabin: string, tripType: string,
): Promise<number | null> {
  const freshCutoff = new Date(Date.now() - CACHE_FRESH_HOURS * 3_600_000).toISOString()

  // 1. flight_itineraries (live API cache)
  const { data: it } = await supabaseAdmin
    .from('flight_itineraries')
    .select('price_inr')
    .eq('search_origin', origin)
    .eq('search_dest', dest)
    .eq('cabin_class', cabin)
    .eq('trip_type', tripType)
    .gte('observed_at', freshCutoff)
    .order('price_inr', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (it?.price_inr) return it.price_inr

  // 2. price_history (scraped / admin-imported)
  const { data: ph } = await supabaseAdmin
    .from('price_history')
    .select('observed_price_inr')
    .eq('origin_iata', origin)
    .eq('dest_iata', dest)
    .gte('observed_at', freshCutoff)
    .order('observed_price_inr', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (ph?.observed_price_inr) return ph.observed_price_inr

  // 3. Live FlightAPI.io (costs credits — only when no fresh cache)
  const apiKey = process.env.FLIGHTAPI_KEY
  if (!apiKey) return null

  try {
    const today    = new Date()
    const depart   = new Date(today.getTime() + LIVE_FETCH_DEPART_DAYS * 86_400_000)
      .toISOString().slice(0, 10)
    const returnD  = tripType === 'roundtrip'
      ? new Date(today.getTime() + LIVE_FETCH_RETURN_DAYS * 86_400_000)
        .toISOString().slice(0, 10)
      : null

    // Map cabin names to FlightAPI.io format
    const cabinMap: Record<string, string> = {
      economy: 'Economy', premium_economy: 'Premium_Economy',
      business: 'Business', first: 'First',
    }
    const cabinApi = cabinMap[cabin] ?? 'Economy'

    const url = returnD
      ? `https://api.flightapi.io/roundtrip/${apiKey}/${origin}/${dest}/${depart}/${returnD}/1/0/0/${cabinApi}/INR`
      : `https://api.flightapi.io/onewaytrip/${apiKey}/${origin}/${dest}/${depart}/1/0/0/${cabinApi}/INR`

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    const raw = await res.json().catch(() => null)

    if (!Array.isArray(raw?.itineraries)) return null

    const prices = (raw.itineraries as unknown[])
      .flatMap((it: unknown) => ((it as { pricing_options?: unknown[] }).pricing_options ?? []))
      .map((po: unknown) => ((po as { price?: { amount?: number } }).price?.amount))
      .filter((a): a is number => typeof a === 'number')

    return prices.length ? Math.min(...prices) : null
  } catch {
    return null
  }
}

// ── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret (set CRON_SECRET in Vercel env vars)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const started = Date.now()
  const summary = { total: 0, checked: 0, triggered: 0, skipped: 0, errors: 0 }

  // Fetch active alerts, oldest-checked first so all alerts get attention over time
  const { data: alerts, error: alertsErr } = await supabaseAdmin
    .from('flight_alerts')
    .select('*')
    .eq('is_active', true)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)

  if (alertsErr) return NextResponse.json({ error: alertsErr.message }, { status: 500 })
  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ message: 'No active alerts to process', ...summary })
  }

  summary.total = alerts.length

  // Load user contact info for all affected users in one shot
  const userIds = [...new Set(alerts.map((a: Record<string, string>) => a.user_id))]

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map((authUsers?.users ?? []).map((u: { id: string }) => [u.id, u]))

  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .in('user_id', userIds)
  const prefMap = new Map((prefs ?? []).map((p: { user_id: string }) => [p.user_id, p]))

  // Price cache: avoid duplicate API calls for the same route in one run
  const priceCache = new Map<string, number | null>()

  for (const alert of alerts) {
    const alertId = alert.id as string
    try {
      const cacheKey = `${alert.origin_iata}|${alert.dest_iata}|${alert.cabin_class}|${alert.trip_type}`

      let currentPrice: number | null
      if (priceCache.has(cacheKey)) {
        currentPrice = priceCache.get(cacheKey)!
      } else {
        currentPrice = await getBestPrice(
          alert.origin_iata, alert.dest_iata, alert.cabin_class, alert.trip_type,
        )
        priceCache.set(cacheKey, currentPrice)
      }

      // Always update last_checked_at (and price if we got one)
      await supabaseAdmin
        .from('flight_alerts')
        .update({
          last_checked_at: new Date().toISOString(),
          ...(currentPrice != null ? { last_price_seen: currentPrice } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)

      summary.checked++

      if (currentPrice == null) { summary.skipped++; continue }

      // Anti-spam: enforce cooldown window
      if (alert.last_notified_at) {
        const hoursSince = (Date.now() - new Date(alert.last_notified_at).getTime()) / 3_600_000
        if (hoursSince < NOTIFY_COOLDOWN_HOURS) { summary.skipped++; continue }
      }

      // Determine trigger type
      let triggerType: 'target_reached' | 'price_drop' | null = null
      if (currentPrice <= (alert.target_price as number)) {
        triggerType = 'target_reached'
      } else if (
        alert.last_price_seen &&
        currentPrice < (alert.last_price_seen as number) * PRICE_DROP_THRESHOLD
      ) {
        triggerType = 'price_drop'
      }

      if (!triggerType) { summary.skipped++; continue }

      // Build user contact
      const user = userMap.get(alert.user_id as string) as Record<string, unknown> | undefined
      if (!user?.email) { summary.skipped++; continue }

      const pref = prefMap.get(alert.user_id as string) as Record<string, unknown> | undefined
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>

      const contact = {
        email:            String(user.email),
        name:             String(meta.full_name ?? meta.name ?? String(user.email).split('@')[0]),
        whatsapp_number:  String(pref?.whatsapp_number ?? meta.mobile ?? '') || null,
        whatsapp_opted_in: Boolean(pref?.whatsapp_opted_in),
        email_opted_in:    pref?.email_opted_in !== false, // default true
      }

      await notifyPriceAlert({
        alert: {
          id:           alertId,
          user_id:      String(alert.user_id),
          origin_iata:  String(alert.origin_iata),
          dest_iata:    String(alert.dest_iata),
          origin_city:  String(alert.origin_city),
          dest_city:    String(alert.dest_city),
          target_price: Number(alert.target_price),
          cabin_class:  String(alert.cabin_class),
          trip_type:    String(alert.trip_type),
          travel_month: alert.travel_month as string | null,
        },
        currentPrice,
        triggerType,
        contact,
      })

      // Mark notified
      await supabaseAdmin
        .from('flight_alerts')
        .update({
          last_notified_at: new Date().toISOString(),
          triggered_count:  ((alert.triggered_count as number) ?? 0) + 1,
          updated_at:       new Date().toISOString(),
        })
        .eq('id', alertId)

      summary.triggered++
    } catch (err) {
      console.error(`[check-alerts] alert ${alertId} error:`, err)
      summary.errors++
    }
  }

  return NextResponse.json({
    ...summary,
    duration_ms: Date.now() - started,
  })
}

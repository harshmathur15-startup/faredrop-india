// Daily deal-discovery agent core. Scans a rotating subset of lanes, finds the
// single best qualifying fare per lane (nonstop or <=1 stop with every layover
// < MAX_LAYOVER_MIN, and >= MIN_DISCOUNT below the lane's typical price), dedups
// against live deals, and (unless dryRun) auto-publishes them. Pure of HTTP.

import type { SupabaseClient } from '@supabase/supabase-js'
import { parseFlightApiResponse, MIN_PLAUSIBLE_INR } from '@/lib/parseFlightApi'
import { googleFlightsCabinUrl } from '@/lib/googleFlights'
import {
  LANES, DEST_IMAGE, ROTATION_GROUPS, DATES_PER_LANE, WINDOW_START_OFFSET,
  MIN_DISCOUNT, MAX_LAYOVER_MIN, PER_LANE_MAX, CONCURRENCY, type Lane,
} from '@/lib/discoveryConfig'

interface Row {
  price_inr: number
  out_airline: string | null; out_stops: number | null; out_via: string | null
  out_duration_min: number | null; out_layover_min: number | null
  ret_airline: string | null; ret_stops: number | null; ret_via: string | null
  ret_duration_min: number | null; ret_layover_min: number | null
}

const addDays = (d: string, n: number) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const dur = (m: number | null) => m == null ? '?' : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
const qualifies = (c: Row) =>
  (c.out_stops ?? 9) <= 1 && (c.ret_stops ?? 9) <= 1 &&
  (c.out_layover_min ?? 0) < MAX_LAYOVER_MIN && (c.ret_layover_min ?? 0) < MAX_LAYOVER_MIN

async function fetchRT(apiKey: string, o: string, d: string, dep: string, ret: string): Promise<Row[]> {
  const url = `https://api.flightapi.io/roundtrip/${apiKey}/${o}/${d}/${dep}/${ret}/1/0/0/Economy/INR`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await (await fetch(url)).json()
      if (!raw?.message && Array.isArray(raw?.itineraries)) {
        const rows = parseFlightApiResponse(raw, { searchOrigin: o, searchDest: d, cabinClass: 'economy', minPrice: MIN_PLAUSIBLE_INR }) as unknown as Row[]
        if (rows.length) return rows
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
  }
  return []
}

function legStr(air: string | null, stops: number | null, via: string | null, d: number | null, lay: number | null): string {
  return stops === 0
    ? `${air} · Nonstop · ${dur(d)}`
    : `${air} · 1 stop via ${via} · ${dur(d)} · layover ${dur(lay)}`
}

export interface DiscoveredDeal {
  origin_iata: string; dest_iata: string; origin_city: string; dest_city: string
  airline: string; normal_price: number; deal_price: number; currency: string
  validity_start: string; validity_end: string; source_url: string; image_url: string
  curator_note: string; is_premium: boolean; discount: number
}

export interface DiscoverySummary {
  ran_at: string; day_index: number; lanes_scanned: number; credits_used: number
  candidates: number; published: number; skipped_dup: number; dry_run: boolean
  deals: DiscoveredDeal[]; errors: { lane: string; error: string }[]
}

export async function discoverDeals(
  supabaseAdmin: SupabaseClient, apiKey: string, opts?: { dryRun?: boolean; dayIndex?: number },
): Promise<DiscoverySummary> {
  const dryRun = opts?.dryRun ?? false
  const now = new Date()
  const dayIndex = opts?.dayIndex ?? Math.floor(now.getTime() / 86400000) % ROTATION_GROUPS
  const iso = now.toISOString()
  const today = iso.slice(0, 10)

  const lanes = LANES.filter((_, i) => i % ROTATION_GROUPS === dayIndex && DEST_IMAGE[LANES[i].dest])
  const summary: DiscoverySummary = {
    ran_at: iso, day_index: dayIndex, lanes_scanned: lanes.length, credits_used: 0,
    candidates: 0, published: 0, skipped_dup: 0, dry_run: dryRun, deals: [], errors: [],
  }

  for (const lane of lanes) {
    const depSet = Array.from({ length: DATES_PER_LANE }, (_, i) => addDays(today, WINDOW_START_OFFSET + i))
    // fetch the window in concurrency-bounded batches
    const perDate = new Map<string, Row | null>()
    for (let i = 0; i < depSet.length; i += CONCURRENCY) {
      const batch = depSet.slice(i, i + CONCURRENCY)
      const out = await Promise.all(batch.map(async dep => {
        const rows = await fetchRT(apiKey, lane.origin, lane.dest, dep, addDays(dep, lane.nights))
        summary.credits_used += 2
        const q = rows.filter(qualifies)
        const best = q.length ? q.reduce((a, b) => (b.price_inr < a.price_inr ? b : a)) : null
        return [dep, best] as const
      }))
      out.forEach(([dep, best]) => perDate.set(dep, best))
    }

    // best qualifying date that clears the discount threshold
    const threshold = Math.round(lane.normalPrice * (1 - MIN_DISCOUNT))
    const ranked = [...perDate.entries()]
      .filter(([, b]) => b && b.price_inr <= threshold && b.price_inr >= MIN_PLAUSIBLE_INR)
      .sort((a, b) => a[1]!.price_inr - b[1]!.price_inr)
    if (!ranked.length) continue
    summary.candidates += ranked.length

    let published = 0
    for (const [dep, best] of ranked) {
      if (published >= PER_LANE_MAX) break
      const ret = addDays(dep, lane.nights)
      // dedup vs existing live deals on same route + exact dates
      const { data: dup } = await supabaseAdmin.from('deals').select('id')
        .eq('origin_iata', lane.origin).eq('dest_iata', lane.dest)
        .eq('validity_start', dep).eq('validity_end', ret)
        .eq('status', 'published').limit(1)
      if (dup && dup.length) { summary.skipped_dup++; continue }

      const c = best!
      const discount = Math.round((1 - c.price_inr / lane.normalPrice) * 100)
      const note = `Economy · Out: ${legStr(c.out_airline, c.out_stops, c.out_via, c.out_duration_min, c.out_layover_min)} · Ret: ${legStr(c.ret_airline, c.ret_stops, c.ret_via, c.ret_duration_min, c.ret_layover_min)} · ${lane.nights}-night trip (${dep} → ${ret}). ~${discount}% under typical. [auto-discovered]`
      const deal: DiscoveredDeal = {
        origin_iata: lane.origin, dest_iata: lane.dest, origin_city: lane.originCity, dest_city: lane.destCity,
        airline: c.out_airline ?? 'Multiple', normal_price: lane.normalPrice, deal_price: c.price_inr, currency: 'INR',
        validity_start: dep, validity_end: ret,
        source_url: googleFlightsCabinUrl(lane.origin, lane.dest, dep, ret, 1),
        image_url: DEST_IMAGE[lane.dest], curator_note: note, is_premium: false, discount,
      }
      summary.deals.push(deal)
      published++

      if (!dryRun) {
        const { discount: _drop, ...dealCols } = deal // `discount` is display-only, not a column
        void _drop
        const { error } = await supabaseAdmin.from('deals').insert({
          ...dealCols, status: 'published', published_at: iso,
          price_retrieved_at: iso, deal_calculated_at: iso, last_verified_at: iso,
        })
        if (error) summary.errors.push({ lane: `${lane.origin}-${lane.dest}`, error: error.message })
        else summary.published++
      }
    }
  }
  if (dryRun) summary.published = summary.deals.length
  return summary
}

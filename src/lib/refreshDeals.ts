// Daily live-deal price refresh (server-side; runs on Vercel cron where the
// FlightAPI + Supabase secrets already live). Re-prices every published deal in
// its OWN cabin against today's cheapest FlightAPI fare, updates the fare
// timestamps, and EXPIRES any deal whose new cheapest is more than
// `expirePctThreshold` above its stored deal_price. Pure of Next/HTTP concerns
// so it can be unit-tested or called from a route.

import type { SupabaseClient } from '@supabase/supabase-js'
import { parseFlightApiResponse, MIN_PLAUSIBLE_INR } from '@/lib/parseFlightApi'

const VALID_CABINS = ['Economy', 'Premium_Economy', 'Business', 'First']

// Cabin is encoded in curator_note; is_premium is a MEMBERSHIP tier, not a cabin.
function detectCabin(note = ''): string {
  const n = note.toLowerCase()
  if (n.includes('business')) return 'Business'
  if (n.includes('first class')) return 'First'
  if (n.includes('premium economy') || n.includes('premium_economy')) return 'Premium_Economy'
  return 'Economy'
}
function detectOneway(note = '', vs?: string, ve?: string): boolean {
  const n = note.toLowerCase()
  if (n.includes('one way') || n.includes('one-way') || n.includes('oneway')) return true
  return vs === ve
}
function detectNonstop(note = ''): boolean {
  const n = note.toLowerCase()
  return n.includes('nonstop') && !n.includes(' stop')
}

// Domestic routes (both endpoints in India) carry a lower minimum-discount
// floor than international ones, because Indian trunk fares are already low and
// swing less. Expand the set as new domestic airports get deals.
const INDIAN_IATA = new Set([
  'DEL','BOM','BLR','MAA','CCU','HYD','GOI','GOX','PNQ','AMD','COK','TRV','CCJ',
  'IXC','JAI','LKO','PAT','GAU','NAG','IXB','IXR','IXZ','IXM','IXE','VNS','BBI',
  'RPR','VTZ','IDR','BHO','STV','HBX','IXA','DIB','IMF','AGR','ATQ','SXR','IXJ',
  'UDR','JDH','BDQ','CJB','TRZ','PNY',
])
const isDomestic = (orig: string, dest: string): boolean =>
  INDIAN_IATA.has(orig) && INDIAN_IATA.has(dest)

interface ParsedRow {
  price_inr: number
  out_airline: string | null
  out_stops: number | null
  ret_stops: number | null
}

interface Search {
  key: string
  origin: string
  dest: string
  depart: string
  ret: string | null
  cabin: string
}

async function fetchSearch(apiKey: string, s: Search): Promise<{ rows: ParsedRow[]; error: string | null }> {
  const cabin = VALID_CABINS.find(c => c.toLowerCase() === s.cabin.toLowerCase()) ?? 'Economy'
  const url = s.ret
    ? `https://api.flightapi.io/roundtrip/${apiKey}/${s.origin}/${s.dest}/${s.depart}/${s.ret}/1/0/0/${cabin}/INR`
    : `https://api.flightapi.io/onewaytrip/${apiKey}/${s.origin}/${s.dest}/${s.depart}/1/0/0/${cabin}/INR`
  try {
    const res = await fetch(url)
    const raw = await res.json()
    if (raw?.message || raw?.success === false || !Array.isArray(raw?.itineraries)) {
      return { rows: [], error: raw?.message ?? `http ${res.status}` }
    }
    const rows = parseFlightApiResponse(raw, {
      searchOrigin: s.origin,
      searchDest: s.dest,
      cabinClass: s.cabin.toLowerCase(),
      minPrice: MIN_PLAUSIBLE_INR,
    }) as ParsedRow[]
    return { rows, error: null }
  } catch (e) {
    return { rows: [], error: String(e) }
  }
}

// FlightAPI throws transient "something went wrong" errors; retry a few times.
async function fetchWithRetry(apiKey: string, s: Search, attempts = 3): Promise<{ rows: ParsedRow[]; error: string | null }> {
  let last: { rows: ParsedRow[]; error: string | null } = { rows: [], error: 'not attempted' }
  for (let i = 0; i < attempts; i++) {
    last = await fetchSearch(apiKey, s)
    if (last.error === null && last.rows.length > 0) return last
    await new Promise(r => setTimeout(r, 400 * (i + 1)))
  }
  return last
}

const cheapestOf = (rows: ParsedRow[]) =>
  rows.length ? rows.reduce((a, b) => (b.price_inr < a.price_inr ? b : a)) : null

export interface DealMovement {
  id: string
  route: string
  city: string
  cabin: string
  dates: string
  old_price: number
  new_price: number
  pct: number
}

export interface RefreshSummary {
  ran_at: string
  today: string
  published_before: number
  published_after: number
  refreshed: number
  increased: number
  decreased: number
  unchanged: number
  expired: number
  expired_past: number
  expired_below_floor: number
  no_fare: number
  skipped_past: number
  credits_used: number
  floor_domestic_pct: number
  floor_intl_pct: number
  expire_threshold_pct: number
  expired_deals: DealMovement[]
  top_increases: DealMovement[]
  top_decreases: DealMovement[]
  errors: { route: string; error: string }[]
}

export async function refreshLiveDeals(
  supabaseAdmin: SupabaseClient,
  apiKey: string,
  opts?: { domesticFloorPct?: number; intlFloorPct?: number; concurrency?: number },
): Promise<RefreshSummary> {
  // Minimum discount (vs the curated normal_price) a deal must keep to stay
  // live. Below this it is expired — this is what keeps weak/above-normal deals
  // off the storefront.
  const domFloor = opts?.domesticFloorPct ?? 10
  const intlFloor = opts?.intlFloorPct ?? 15
  const concurrency = opts?.concurrency ?? 8
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('id,origin_iata,dest_iata,origin_city,dest_city,normal_price,deal_price,validity_start,validity_end,curator_note')
    .eq('status', 'published')
  if (error) throw new Error(`load deals: ${error.message}`)
  const publishedBefore = deals?.length ?? 0

  // Build per-deal search specs + dedupe identical (route/date/cabin) searches.
  const searchMap = new Map<string, Search>()
  const specs = (deals ?? []).map(d => {
    const cabin = detectCabin(d.curator_note ?? '')
    const oneway = detectOneway(d.curator_note ?? '', d.validity_start, d.validity_end)
    const depart: string = d.validity_start
    const ret: string | null = oneway ? null : d.validity_end
    const past = !depart || depart < today
    const nonstop = detectNonstop(d.curator_note ?? '')
    const key = [d.origin_iata, d.dest_iata, depart, ret ?? '', cabin].join('|')
    if (!past && !searchMap.has(key)) {
      searchMap.set(key, { key, origin: d.origin_iata, dest: d.dest_iata, depart, ret, cabin })
    }
    return { deal: d, cabin, ret, depart, key, past, nonstop }
  })

  const searches = [...searchMap.values()]
  const creditsUsed = searches.reduce((s, x) => s + (x.ret ? 2 : 1), 0)

  // Fetch fares in bounded-concurrency batches.
  const resultByKey = new Map<string, { rows: ParsedRow[]; error: string | null }>()
  for (let i = 0; i < searches.length; i += concurrency) {
    const batch = searches.slice(i, i + concurrency)
    const out = await Promise.all(batch.map(s => fetchWithRetry(apiKey, s).then(r => [s.key, r] as const)))
    for (const [k, r] of out) resultByKey.set(k, r)
  }

  const summary: RefreshSummary = {
    ran_at: now, today,
    published_before: publishedBefore, published_after: publishedBefore,
    refreshed: 0, increased: 0, decreased: 0, unchanged: 0,
    expired: 0, expired_past: 0, expired_below_floor: 0, no_fare: 0,
    skipped_past: 0,
    credits_used: creditsUsed,
    floor_domestic_pct: domFloor, floor_intl_pct: intlFloor,
    expire_threshold_pct: intlFloor, // back-compat: reflects the intl floor
    expired_deals: [], top_increases: [], top_decreases: [], errors: [],
  }

  for (const { deal, cabin, ret, depart, key, past, nonstop } of specs) {
    const route = `${deal.origin_iata}-${deal.dest_iata}`
    const floorPct = isDomestic(deal.origin_iata, deal.dest_iata) ? domFloor : intlFloor

    // Past-dated: the travel date has already gone — expire regardless of price.
    if (past) {
      const { error: upErr } = await supabaseAdmin.from('deals')
        .update({ status: 'expired', last_verified_at: now }).eq('id', deal.id)
      if (upErr) summary.errors.push({ route, error: `expire-past: ${upErr.message}` })
      else { summary.expired++; summary.expired_past++ }
      continue
    }

    const r = resultByKey.get(key)
    const rows = r?.rows ?? []
    if (rows.length === 0) {
      summary.no_fare++
      if (r?.error) summary.errors.push({ route, error: r.error })
      continue
    }
    const nsRows = rows.filter(x => x.out_stops === 0 && (ret ? x.ret_stops === 0 : true))
    const base = (nonstop && nsRows.length) ? cheapestOf(nsRows)! : cheapestOf(rows)!
    const newPrice = base.price_inr
    const oldPrice = deal.deal_price as number
    const normal = deal.normal_price as number
    const pct = oldPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
    // Discount vs the curated normal baseline — the number the customer sees.
    const discountPct = normal > 0 ? ((normal - newPrice) / normal) * 100 : -Infinity
    const move: DealMovement = {
      id: deal.id, route,
      city: `${deal.origin_city} → ${deal.dest_city}`, cabin,
      dates: ret ? `${depart}→${ret}` : depart,
      old_price: oldPrice, new_price: newPrice, pct: Math.round(pct * 10) / 10,
    }

    // Expire when the live fare no longer clears the minimum-discount floor vs
    // the normal baseline (domestic 10%, international 15%). Measuring against
    // normal_price — not the rolling deal_price — is the fix: it catches fares
    // that crept up over many days and blew past normal, which a
    // rise-vs-last-price guard never trips.
    if (discountPct < floorPct) {
      const { error: upErr } = await supabaseAdmin.from('deals')
        .update({ status: 'expired', last_verified_at: now }).eq('id', deal.id)
      if (upErr) { summary.errors.push({ route, error: `expire: ${upErr.message}` }); continue }
      summary.expired++
      summary.expired_below_floor++
      summary.expired_deals.push(move)
      continue
    }

    const moved = newPrice !== oldPrice
    const update: Record<string, unknown> = { deal_price: newPrice, price_retrieved_at: now, last_verified_at: now }
    if (moved) update.deal_calculated_at = now
    const { error: upErr } = await supabaseAdmin.from('deals').update(update).eq('id', deal.id)
    if (upErr) { summary.errors.push({ route: move.route, error: `update: ${upErr.message}` }); continue }
    summary.refreshed++
    if (pct > 0) { summary.increased++; summary.top_increases.push(move) }
    else if (pct < 0) { summary.decreased++; summary.top_decreases.push(move) }
    else summary.unchanged++
  }

  summary.published_after = publishedBefore - summary.expired
  summary.top_increases.sort((a, b) => b.pct - a.pct)
  summary.top_decreases.sort((a, b) => a.pct - b.pct)
  summary.top_increases = summary.top_increases.slice(0, 8)
  summary.top_decreases = summary.top_decreases.slice(0, 8)
  return summary
}

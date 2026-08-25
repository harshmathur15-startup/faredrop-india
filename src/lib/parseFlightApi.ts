// Parses a raw FlightAPI.io roundtrip/oneway response into flight_itineraries rows.
// Pure function — no network, no DB. Used by the loader script and the fetch-fares route.

export interface ItineraryRow {
  search_origin: string
  search_dest: string
  trip_type: 'roundtrip' | 'oneway'
  cabin_class: string
  price_inr: number
  currency: string
  out_airline: string | null
  out_stops: number | null
  out_depart: string | null
  out_arrive: string | null
  out_duration_min: number | null
  out_via: string | null
  out_layover_min: number | null
  ret_airline: string | null
  ret_stops: number | null
  ret_depart: string | null
  ret_arrive: string | null
  ret_duration_min: number | null
  ret_via: string | null
  ret_layover_min: number | null
  source: string
  observed_at: string
  dedupe_key: string
  // Logical identity + fare timestamps (Phase 2/3). itinerary_key EXCLUDES
  // price/timestamp/observation-day so a re-price does not fork the identity.
  itinerary_key: string
  price_retrieved_at: string
  deal_calculated_at: string
  last_verified_at: string
}

interface ParseOpts {
  searchOrigin: string
  searchDest: string
  cabinClass?: string
  currency?: string
  source?: string
  observedAt?: string
  // Maximum itineraries stored per search (cheapest, nonstop/one-stop first).
  limit?: number
  // Reject fares below this (currency-glitch / bad-data guard).
  minPrice?: number
}

// Hard ceiling on rows stored per API search, regardless of opts.
export const MAX_ITINERARIES = 25
// Absolute floor: an international INR fare below this is almost certainly a
// wrong-currency glitch (e.g. a USD amount served as INR).
export const MIN_PLAUSIBLE_INR = 1000
// Bound how many raw itineraries we bother to fully build before ranking.
const BUILD_SCAN_LIMIT = 200

// Normalise an API timestamp to canonical 'YYYY-MM-DDTHH:MM:SS' (19 chars) so
// the itinerary_key matches the SQL fi_itinerary_key() backfill byte-for-byte.
function isoSecond(s: string | null | undefined): string {
  if (!s) return ''
  let t = String(s).slice(0, 19)
  if (t.length === 16) t += ':00' // API omitted seconds
  return t
}

export interface ItineraryKeyFields {
  search_origin: string
  search_dest: string
  trip_type: string
  cabin_class: string
  out_depart: string | null
  out_arrive: string | null
  out_airline: string | null
  out_stops: number | null
  out_via: string | null
  ret_depart: string | null
  ret_arrive: string | null
  ret_airline: string | null
  ret_stops: number | null
  ret_via: string | null
}

// Canonical logical itinerary identity. MUST match fi_itinerary_key() in
// supabase/migrations/20260825120000_add_fare_timestamps_and_itinerary_key.sql.
export function buildItineraryKey(f: ItineraryKeyFields): string {
  const s = (v: string | null | undefined) => v ?? ''
  const n = (v: number | null | undefined) => (v == null ? '' : String(v))
  return [
    s(f.search_origin),
    s(f.search_dest),
    s(f.trip_type),
    (f.cabin_class ?? '').toLowerCase(),
    isoSecond(f.out_depart),
    isoSecond(f.out_arrive),
    s(f.out_airline),
    n(f.out_stops),
    s(f.out_via),
    isoSecond(f.ret_depart),
    isoSecond(f.ret_arrive),
    s(f.ret_airline),
    n(f.ret_stops),
    s(f.ret_via),
  ].join('|')
}

// max stops across both legs; nonstop=0, one-stop=1. Used for prioritisation.
function maxStops(row: ItineraryRow): number {
  return Math.max(row.out_stops ?? 9, row.ret_stops ?? 0)
}

export function parseFlightApiResponse(raw: any, opts: ParseOpts): ItineraryRow[] {
  if (!raw || !Array.isArray(raw.itineraries) || raw.itineraries.length === 0) return []

  const legById = new Map<string, any>((raw.legs ?? []).map((l: any) => [l.id, l]))
  const placeById = new Map<string, any>((raw.places ?? []).map((p: any) => [String(p.id), p]))
  const carrierById = new Map<string, any>((raw.carriers ?? []).map((c: any) => [String(c.id), c]))
  const segDuration = new Map<string, number>((raw.segments ?? []).map((s: any) => [s.id, s.duration]))

  const code = (id: number | string) => placeById.get(String(id))?.display_code ?? String(id)
  const carrierName = (id: number | string) => carrierById.get(String(id))?.name ?? 'Unknown'

  const legInfo = (legId: string) => {
    const l = legById.get(legId)
    if (!l) return null
    const flyTime = (l.segment_ids ?? []).reduce((s: number, sid: string) => s + (segDuration.get(sid) ?? 0), 0)
    const carriers = Array.from(new Set((l.marketing_carrier_ids ?? []).map(carrierName)))
    const stopovers = (l.stop_ids ?? []).flat().map(code)
    return {
      airline: carriers.join('/') || 'Unknown',
      stops: l.stop_count ?? null,
      depart: l.departure ?? null,
      arrive: l.arrival ?? null,
      duration_min: l.duration ?? null,
      via: stopovers.join(',') || '',
      layover_min: l.duration != null ? l.duration - flyTime : null,
    }
  }

  const observedAt = opts.observedAt ?? new Date().toISOString()
  const observedDay = observedAt.slice(0, 10)
  const cabin = opts.cabinClass ?? 'economy'
  const currency = opts.currency ?? 'INR'
  const source = opts.source ?? 'flightapi-io'
  const limit = Math.min(opts.limit ?? MAX_ITINERARIES, MAX_ITINERARIES)
  const minPrice = opts.minPrice ?? MIN_PLAUSIBLE_INR

  // 1. Extract valid prices; reject missing/implausible fares.
  const priced = raw.itineraries
    .map((it: any) => {
      const amounts = (it.pricing_options ?? [])
        .map((po: any) => po?.price?.amount)
        .filter((a: any) => typeof a === 'number' && Number.isFinite(a) && a > 0)
      const price = amounts.length ? Math.min(...amounts) : null
      return { price, legIds: it.leg_ids ?? [] }
    })
    .filter((x: any) => x.price != null && x.price >= minPrice && Array.isArray(x.legIds) && x.legIds.length > 0)
    .sort((a: any, b: any) => a.price - b.price)
    .slice(0, BUILD_SCAN_LIMIT)

  // 2. Build full rows (need per-leg stops to prioritise nonstop/one-stop).
  const built: ItineraryRow[] = []
  for (const it of priced) {
    const o = legInfo(it.legIds[0])
    if (!o) continue // no valid outbound leg -> reject
    const r = it.legIds[1] ? legInfo(it.legIds[1]) : null
    const tripType: 'roundtrip' | 'oneway' = r ? 'roundtrip' : 'oneway'
    const price = Math.round(it.price)

    const dedupe_key = [
      opts.searchOrigin, opts.searchDest, tripType,
      o.depart ?? '', r?.depart ?? '',
      o.airline, r?.airline ?? '',
      o.stops ?? '', r?.stops ?? '',
      price, observedDay,
    ].join('|')

    const keyFields: ItineraryKeyFields = {
      search_origin: opts.searchOrigin,
      search_dest: opts.searchDest,
      trip_type: tripType,
      cabin_class: cabin,
      out_depart: o.depart,
      out_arrive: o.arrive,
      out_airline: o.airline,
      out_stops: o.stops,
      out_via: o.via,
      ret_depart: r?.depart ?? null,
      ret_arrive: r?.arrive ?? null,
      ret_airline: r?.airline ?? null,
      ret_stops: r?.stops ?? null,
      ret_via: r?.via ?? null,
    }

    built.push({
      search_origin: opts.searchOrigin,
      search_dest: opts.searchDest,
      trip_type: tripType,
      cabin_class: cabin,
      price_inr: price,
      currency,
      out_airline: o.airline,
      out_stops: o.stops,
      out_depart: o.depart,
      out_arrive: o.arrive,
      out_duration_min: o.duration_min,
      out_via: o.via,
      out_layover_min: o.layover_min,
      ret_airline: r?.airline ?? null,
      ret_stops: r?.stops ?? null,
      ret_depart: r?.depart ?? null,
      ret_arrive: r?.arrive ?? null,
      ret_duration_min: r?.duration_min ?? null,
      ret_via: r?.via ?? null,
      ret_layover_min: r?.layover_min ?? null,
      source,
      observed_at: observedAt,
      dedupe_key,
      itinerary_key: buildItineraryKey(keyFields),
      price_retrieved_at: observedAt,
      deal_calculated_at: observedAt,
      last_verified_at: observedAt,
    })
  }

  // 3. De-duplicate by itinerary_key (keep cheapest — already price-sorted).
  const seen = new Set<string>()
  const unique = built.filter(r => (seen.has(r.itinerary_key) ? false : (seen.add(r.itinerary_key), true)))

  // 4. Prioritise nonstop/one-stop, then price; cap at the limit.
  unique.sort((a, b) => {
    const pa = maxStops(a) <= 1 ? 0 : 1
    const pb = maxStops(b) <= 1 ? 0 : 1
    if (pa !== pb) return pa - pb
    return a.price_inr - b.price_inr
  })

  return unique.slice(0, limit)
}

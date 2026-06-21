// Parses a raw FlightAPI.io roundtrip/oneway response into flight_itineraries rows.
// Pure function — no network, no DB. Used by the loader script and the explore route.

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
}

interface ParseOpts {
  searchOrigin: string
  searchDest: string
  cabinClass?: string
  currency?: string
  source?: string
  observedAt?: string
  // keep only the cheapest N itineraries (default: all)
  limit?: number
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

  const priced = raw.itineraries
    .map((it: any) => {
      const amounts = (it.pricing_options ?? [])
        .map((po: any) => po?.price?.amount)
        .filter((a: any) => typeof a === 'number')
      const price = amounts.length ? Math.min(...amounts) : null
      return { price, legIds: it.leg_ids ?? [] }
    })
    .filter((x: any) => x.price != null)
    .sort((a: any, b: any) => a.price - b.price)

  const chosen = opts.limit ? priced.slice(0, opts.limit) : priced

  const rows: ItineraryRow[] = []
  for (const it of chosen) {
    const o = legInfo(it.legIds[0])
    if (!o) continue
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

    rows.push({
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
    })
  }

  // de-duplicate within this batch by dedupe_key (keep first = cheapest)
  const seen = new Set<string>()
  return rows.filter(r => (seen.has(r.dedupe_key) ? false : (seen.add(r.dedupe_key), true)))
}

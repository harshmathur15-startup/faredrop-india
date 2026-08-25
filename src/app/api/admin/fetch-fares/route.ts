import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseFlightApiResponse } from '@/lib/parseFlightApi'
import { requireAdmin, rateLimit, clientKey, tooManyRequests } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

// How long stored fares are considered "fresh" before a new pull is allowed.
const FRESH_HOURS = 24
// Expensive endpoint: cap refresh calls per client.
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

const VALID_CABINS = ['Economy', 'Premium_Economy', 'Business', 'First']

function nextDay(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  // ---- AUTH + RATE LIMIT: fail before any FlightAPI/Supabase work ----
  const authErr = requireAdmin(req)
  if (authErr) return authErr
  if (!rateLimit(clientKey(req, 'fetch-fares'), RATE_LIMIT, RATE_WINDOW_MS)) {
    return tooManyRequests()
  }

  try {
    const body = await req.json()
    const {
      origin,
      dest,
      depart_date,
      return_date,
      cabin_class = 'Economy',
      force = false,
    } = body

    if (!origin || !dest || !depart_date) {
      return NextResponse.json(
        { error: 'origin, dest and depart_date are required' },
        { status: 400 },
      )
    }

    const cabin = VALID_CABINS.find(c => c.toLowerCase() === String(cabin_class).toLowerCase())
    if (!cabin) {
      return NextResponse.json(
        { error: `cabin_class must be one of: ${VALID_CABINS.join(', ')}` },
        { status: 400 },
      )
    }
    const cabinStored = cabin.toLowerCase()
    const tripType = return_date ? 'roundtrip' : 'oneway'

    // ---------- 1. CACHE-FIRST: current, fresh, cheapest row only ----------
    const freshCutoff = new Date(Date.now() - FRESH_HOURS * 3600 * 1000).toISOString()

    // Build the "current, fresh, matching" filter with the select applied up
    // front (so head-only COUNT and the row read share one filter definition).
    const buildCurrentFareQuery = (
      selectArg: string,
      opts?: { count: 'exact'; head: true },
    ) => {
      let q = supabaseAdmin
        .from('flight_itineraries')
        .select(selectArg, opts)
        .is('superseded_at', null)
        .eq('search_origin', origin)
        .eq('search_dest', dest)
        .eq('cabin_class', cabinStored)
        .eq('trip_type', tripType)
        .gte('out_depart', `${depart_date}T00:00:00`)
        .lt('out_depart', `${nextDay(depart_date)}T00:00:00`)
        .gte('observed_at', freshCutoff)
      if (return_date) {
        q = q
          .gte('ret_depart', `${return_date}T00:00:00`)
          .lt('ret_depart', `${nextDay(return_date)}T00:00:00`)
      }
      return q
    }

    // Only the cheapest current fare is needed to answer "is there fresh data?"
    const { data: cheapestRows } = await buildCurrentFareQuery(
      'price_inr, out_stops, ret_stops, last_verified_at, observed_at',
    )
      .order('price_inr', { ascending: true })
      .limit(1)
    const cheapest = (cheapestRows?.[0] ?? null) as
      | { price_inr: number; last_verified_at: string | null; observed_at: string | null }
      | null

    if (!force && cheapest) {
      // Count only when we actually serve from cache (indexed, head-only).
      const { count } = await buildCurrentFareQuery('price_inr', { count: 'exact', head: true })
      return NextResponse.json({
        source: 'cache',
        credits_used: 0,
        route: `${origin}-${dest}`,
        cabin: cabinStored,
        stored: count ?? null,
        cheapest: cheapest.price_inr,
        last_verified_at: cheapest.last_verified_at ?? cheapest.observed_at ?? null,
        message: `Served cheapest current fare from database (fresh < ${FRESH_HOURS}h) — no credits used.`,
      })
    }

    // ---------- 2. LIVE PULL from FlightAPI.io ----------
    const apiKey = process.env.FLIGHTAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'FLIGHTAPI_KEY not configured' }, { status: 500 })
    }

    const url = return_date
      ? `https://api.flightapi.io/roundtrip/${apiKey}/${origin}/${dest}/${depart_date}/${return_date}/1/0/0/${cabin}/INR`
      : `https://api.flightapi.io/onewaytrip/${apiKey}/${origin}/${dest}/${depart_date}/1/0/0/${cabin}/INR`

    const res = await fetch(url)
    const raw = await res.json()

    if (raw?.message || raw?.success === false || !Array.isArray(raw?.itineraries)) {
      return NextResponse.json(
        { error: 'FlightAPI.io error or no flights', detail: raw?.message ?? raw },
        { status: 502 },
      )
    }

    // ---------- 3. PARSE (<=25 cheapest, nonstop/one-stop first, validated) ----------
    const rows = parseFlightApiResponse(raw, {
      searchOrigin: origin,
      searchDest: dest,
      cabinClass: cabinStored,
      currency: 'INR',
      source: 'flightapi-io',
      observedAt: new Date().toISOString(),
    })

    if (rows.length === 0) {
      return NextResponse.json({ source: 'api', credits_used: return_date ? 2 : 1, stored: 0, message: 'No valid itineraries found.' })
    }

    // ---------- 4. TRANSACTIONAL INGEST (insert -> supersede old; never on failure) ----------
    const { data: ingestResult, error: ingestError } = await supabaseAdmin.rpc('ingest_itineraries', {
      p_rows: rows,
    })

    if (ingestError) {
      return NextResponse.json({ error: ingestError.message, parsed: rows.length }, { status: 500 })
    }

    const prices = rows.map(r => r.price_inr)
    const nonstopBoth = rows.filter(r => r.out_stops === 0 && r.ret_stops === 0).length

    return NextResponse.json({
      source: 'api',
      credits_used: return_date ? 2 : 1,
      route: `${origin}-${dest}`,
      cabin: cabinStored,
      trip_type: tripType,
      parsed: rows.length,
      ingest: ingestResult ?? null,
      cheapest: Math.min(...prices),
      highest: Math.max(...prices),
      nonstop_both_ways: nonstopBoth,
      message: `Pulled ${rows.length} itineraries for ${origin}-${dest} (${cabinStored}); ingested transactionally.`,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST { origin, dest, depart_date, return_date?, cabin_class?, force? } with x-admin-token header',
    cabins: VALID_CABINS,
    note: `Admin-only. Cache-first: returns the cheapest current DB fare free if fresher than ${FRESH_HOURS}h. Set force:true to re-pull. Stores <=25 rows/search.`,
  })
}

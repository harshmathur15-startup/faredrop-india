import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseFlightApiResponse } from '@/lib/parseFlightApi'

export const dynamic = 'force-dynamic'

// How long stored fares are considered "fresh" before a new pull is allowed.
const FRESH_HOURS = 24

const VALID_CABINS = ['Economy', 'Premium_Economy', 'Business', 'First']

function nextDay(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
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

    // ---------- 1. CACHE-FIRST: is there fresh data already? ----------
    const freshCutoff = new Date(Date.now() - FRESH_HOURS * 3600 * 1000).toISOString()
    let cacheQuery = supabaseAdmin
      .from('flight_itineraries')
      .select('*')
      .eq('search_origin', origin)
      .eq('search_dest', dest)
      .eq('cabin_class', cabinStored)
      .eq('trip_type', tripType)
      .gte('out_depart', `${depart_date}T00:00:00`)
      .lt('out_depart', `${nextDay(depart_date)}T00:00:00`)
      .gte('observed_at', freshCutoff)
      .order('price_inr', { ascending: true })

    if (return_date) {
      cacheQuery = cacheQuery
        .gte('ret_depart', `${return_date}T00:00:00`)
        .lt('ret_depart', `${nextDay(return_date)}T00:00:00`)
    }

    const { data: cached } = await cacheQuery

    if (!force && cached && cached.length > 0) {
      return NextResponse.json({
        source: 'cache',
        credits_used: 0,
        route: `${origin}-${dest}`,
        cabin: cabinStored,
        stored: cached.length,
        cheapest: cached[0]?.price_inr ?? null,
        message: `Served ${cached.length} fares from database (fresh < ${FRESH_HOURS}h) — no credits used.`,
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

    // ---------- 3. PARSE full detail ----------
    const rows = parseFlightApiResponse(raw, {
      searchOrigin: origin,
      searchDest: dest,
      cabinClass: cabinStored,
      currency: 'INR',
      source: 'flightapi-io',
      observedAt: new Date().toISOString(),
    })

    if (rows.length === 0) {
      return NextResponse.json({ source: 'api', credits_used: 2, stored: 0, message: 'No priced itineraries found.' })
    }

    // ---------- 4. STORE EVERYTHING (dedupe via dedupe_key) ----------
    const { error: insertError } = await supabaseAdmin
      .from('flight_itineraries')
      .upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true })

    if (insertError) {
      return NextResponse.json({ error: insertError.message, parsed: rows.length }, { status: 500 })
    }

    const prices = rows.map(r => r.price_inr)
    const nonstopBoth = rows.filter(r => r.out_stops === 0 && r.ret_stops === 0).length

    return NextResponse.json({
      source: 'api',
      credits_used: return_date ? 2 : 1,
      route: `${origin}-${dest}`,
      cabin: cabinStored,
      trip_type: tripType,
      stored: rows.length,
      cheapest: Math.min(...prices),
      highest: Math.max(...prices),
      nonstop_both_ways: nonstopBoth,
      message: `Pulled and stored ${rows.length} itineraries for ${origin}-${dest} (${cabinStored}).`,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST { origin, dest, depart_date, return_date?, cabin_class?, force? }',
    cabins: VALID_CABINS,
    note: 'Cache-first: returns DB data free if fresher than ' + FRESH_HOURS + 'h. Set force:true to always re-pull.',
  })
}

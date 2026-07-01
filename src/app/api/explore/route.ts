import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const DESTINATIONS_BY_REGION: Record<string, { city: string; iata: string }[]> = {
  'Southeast Asia': [
    { city: 'Bali', iata: 'DPS' }, { city: 'Bangkok', iata: 'BKK' },
    { city: 'Singapore', iata: 'SIN' }, { city: 'Kuala Lumpur', iata: 'KUL' },
    { city: 'Phuket', iata: 'HKT' }, { city: 'Ho Chi Minh City', iata: 'SGN' },
    { city: 'Hanoi', iata: 'HAN' }, { city: 'Manila', iata: 'MNL' },
  ],
  'Middle East': [
    { city: 'Dubai', iata: 'DXB' }, { city: 'Abu Dhabi', iata: 'AUH' },
    { city: 'Doha', iata: 'DOH' }, { city: 'Muscat', iata: 'MCT' },
  ],
  'East Asia': [
    { city: 'Tokyo', iata: 'NRT' }, { city: 'Osaka', iata: 'KIX' },
    { city: 'Seoul', iata: 'ICN' }, { city: 'Hong Kong', iata: 'HKG' },
    { city: 'Taipei', iata: 'TPE' },
  ],
  'Europe': [
    { city: 'London', iata: 'LHR' }, { city: 'Paris', iata: 'CDG' },
    { city: 'Amsterdam', iata: 'AMS' }, { city: 'Frankfurt', iata: 'FRA' },
    { city: 'Rome', iata: 'FCO' }, { city: 'Barcelona', iata: 'BCN' },
    { city: 'Istanbul', iata: 'IST' },
  ],
  'Americas': [
    { city: 'New York', iata: 'JFK' }, { city: 'Los Angeles', iata: 'LAX' },
    { city: 'Toronto', iata: 'YYZ' }, { city: 'San Francisco', iata: 'SFO' },
  ],
  'South Asia / Indian Ocean': [
    { city: 'Male', iata: 'MLE' }, { city: 'Colombo', iata: 'CMB' },
    { city: 'Kathmandu', iata: 'KTM' },
  ],
  'Africa & Australia': [
    { city: 'Nairobi', iata: 'NBO' }, { city: 'Johannesburg', iata: 'JNB' },
    { city: 'Sydney', iata: 'SYD' }, { city: 'Melbourne', iata: 'MEL' },
  ],
}

const BASELINE_PRICES: Record<string, number> = {
  'DEL-DPS': 52000, 'DEL-BKK': 32000, 'DEL-SIN': 38000, 'DEL-KUL': 34000,
  'DEL-HKT': 37000, 'DEL-SGN': 36000, 'DEL-HAN': 35000, 'DEL-MNL': 42000,
  'DEL-DXB': 34000, 'DEL-AUH': 35000, 'DEL-DOH': 33000, 'DEL-MCT': 32000,
  'DEL-NRT': 78000, 'DEL-KIX': 76000, 'DEL-ICN': 72000, 'DEL-HKG': 55000, 'DEL-TPE': 58000,
  'DEL-LHR': 72000, 'DEL-CDG': 74000, 'DEL-AMS': 73000, 'DEL-FRA': 72000,
  'DEL-FCO': 75000, 'DEL-BCN': 76000, 'DEL-IST': 45000,
  'DEL-JFK': 95000, 'DEL-LAX': 98000, 'DEL-YYZ': 90000, 'DEL-SFO': 96000,
  'DEL-MLE': 32000, 'DEL-CMB': 20000, 'DEL-KTM': 14000,
  'DEL-NBO': 52000, 'DEL-JNB': 68000, 'DEL-SYD': 88000, 'DEL-MEL': 90000,
  'BOM-DPS': 54000, 'BOM-BKK': 35000, 'BOM-SIN': 42000, 'BOM-KUL': 37000,
  'BOM-HKT': 40000, 'BOM-SGN': 38000, 'BOM-MNL': 44000,
  'BOM-DXB': 30000, 'BOM-AUH': 31000, 'BOM-DOH': 30000, 'BOM-MCT': 28000,
  'BOM-NRT': 80000, 'BOM-KIX': 78000, 'BOM-ICN': 74000, 'BOM-HKG': 57000,
  'BOM-LHR': 75000, 'BOM-CDG': 76000, 'BOM-AMS': 75000, 'BOM-FRA': 74000,
  'BOM-FCO': 77000, 'BOM-BCN': 78000, 'BOM-IST': 47000,
  'BOM-JFK': 97000, 'BOM-LAX': 100000, 'BOM-YYZ': 92000, 'BOM-SFO': 98000,
  'BOM-MLE': 25000, 'BOM-CMB': 18000, 'BOM-KTM': 22000,
  'BOM-NBO': 50000, 'BOM-JNB': 66000, 'BOM-SYD': 90000, 'BOM-MEL': 92000,
  'BLR-DPS': 50000, 'BLR-BKK': 34000, 'BLR-SIN': 38000, 'BLR-KUL': 35000,
  'BLR-HKT': 38000, 'BLR-SGN': 37000, 'BLR-MNL': 43000,
  'BLR-DXB': 32000, 'BLR-AUH': 33000, 'BLR-DOH': 31000, 'BLR-MCT': 30000,
  'BLR-NRT': 78000, 'BLR-ICN': 72000, 'BLR-HKG': 55000,
  'BLR-LHR': 73000, 'BLR-CDG': 75000, 'BLR-AMS': 74000, 'BLR-IST': 46000,
  'BLR-JFK': 96000, 'BLR-LAX': 99000, 'BLR-SFO': 97000,
  'BLR-MLE': 20000, 'BLR-CMB': 16000, 'BLR-KTM': 20000,
  'BLR-JNB': 65000, 'BLR-SYD': 88000, 'BLR-MEL': 90000,
  'MAA-DXB': 30000, 'MAA-SIN': 34000, 'MAA-BKK': 32000, 'MAA-CMB': 14000,
  'MAA-KUL': 30000, 'MAA-MLE': 18000, 'MAA-LHR': 70000, 'MAA-IST': 44000,
  'MAA-JFK': 94000, 'MAA-SYD': 86000,
  'HYD-DXB': 31000, 'HYD-SIN': 35000, 'HYD-BKK': 32000, 'HYD-KUL': 30000,
  'HYD-LHR': 72000, 'HYD-NRT': 76000, 'HYD-MLE': 22000, 'HYD-CMB': 16000,
  'HYD-IST': 45000, 'HYD-JFK': 95000, 'HYD-SYD': 87000,
}

const fmt = (d: Date) => d.toISOString().split('T')[0]

function getFirstFridayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 1)
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1)
  // If in the past, push to next month's first friday
  if (d < new Date()) d.setDate(d.getDate() + 28)
  return d
}

async function getCachedResult(cacheKey: string) {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data } = await supabaseAdmin
      .from('explore_cache')
      .select('results')
      .eq('cache_key', cacheKey)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data?.results ?? null
  } catch { return null }
}

async function setCachedResult(cacheKey: string, results: unknown) {
  try {
    await supabaseAdmin.from('explore_cache')
      .upsert({ cache_key: cacheKey, results, created_at: new Date().toISOString() }, { onConflict: 'cache_key' })
  } catch { /* non-critical */ }
}

async function fetchFlight(
  origin: string, destIata: string, destCity: string,
  departDate: Date, tripType: string, maxStops: string, apiKey: string
) {
  const returnDate = new Date(departDate)
  returnDate.setDate(returnDate.getDate() + 7)

  try {
    // FlightAPI.io uses PATH-BASED URLs, not query params:
    // oneway:    /onewaytrip/{key}/{dep}/{arr}/{date}/{adults}/{children}/{infants}/{cabin}/{currency}
    // roundtrip: /roundtrip/{key}/{dep}/{arr}/{dep_date}/{ret_date}/{adults}/{children}/{infants}/{cabin}/{currency}
    const url = tripType === 'one-way'
      ? `https://api.flightapi.io/onewaytrip/${apiKey}/${origin}/${destIata}/${fmt(departDate)}/1/0/0/Economy/INR`
      : `https://api.flightapi.io/roundtrip/${apiKey}/${origin}/${destIata}/${fmt(departDate)}/${fmt(returnDate)}/1/0/0/Economy/INR`

    const res = await fetch(url)
    const data = await res.json()

    // Quota exhausted or error response
    if (data.message?.includes('quota') || data.message?.includes('limit')) {
      throw new Error('quota')
    }

    const itineraries = data.itineraries
    if (!Array.isArray(itineraries) || itineraries.length === 0) return null

    // Each itinerary has pricing_options[].price.amount — find cheapest across all
    let cheapest = Infinity
    for (const itin of itineraries) {
      for (const po of itin.pricing_options ?? []) {
        const amt = po.price?.amount
        if (typeof amt === 'number' && amt < cheapest) cheapest = amt
      }
    }
    if (!isFinite(cheapest)) return null

    const price = Math.round(cheapest)
    const airline = 'Various'

    const routeKey = `${origin}-${destIata}`
    const baseline = BASELINE_PRICES[routeKey] ?? price * 1.6
    const discountPct = Math.round(((baseline - price) / baseline) * 100)

    return {
      origin_iata: origin,
      dest_iata: destIata,
      dest_city: destCity,
      price,
      baseline,
      airline,
      stops: 1,
      is_direct: false,
      trip_type: tripType,
      departure_date: fmt(departDate),
      return_date: tripType !== 'one-way' ? fmt(returnDate) : null,
      google_flights_url: `https://www.google.com/travel/flights?hl=en&gl=in#flt=${origin}.${destIata}.${fmt(departDate)}${tripType !== 'one-way' ? `*${destIata}.${origin}.${fmt(returnDate)}` : ''};c:INR;e:1;sd:1`,
      discount_pct: discountPct,
      tier: discountPct >= 50 ? 'great' : discountPct >= 30 ? 'good' : 'normal',
    }
  } catch (e) {
    throw e
  }
}

async function savePriceHistory(origin: string, destIata: string, price: number, airline: string, stops: number = 1) {
  try {
    await supabaseAdmin.from('price_history').insert({
      origin_iata: origin,
      dest_iata: destIata,
      airline,
      observed_price_inr: price,
      observed_at: new Date().toISOString(),
      currency: 'INR',
      source: 'flightapi-io',
      stops,
      is_direct: stops === 0,
    })
  } catch {
    // Non-critical — log but don't fail
  }
}

async function getStoredPrices(origin: string, destIata: string) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabaseAdmin
      .from('price_history')
      .select('observed_price_inr, airline, observed_at')
      .eq('origin_iata', origin)
      .eq('dest_iata', destIata)
      .gte('observed_at', thirtyDaysAgo)
      .order('observed_at', { ascending: false })
      .limit(20)
    return data ?? []
  } catch { return [] }
}

function buildResult(
  origin: string, dest: { city: string; iata: string },
  price: number, airline: string, departDate: Date,
  tripType: string, source: 'supabase' | 'serpapi' | 'baseline'
) {
  const returnDate = new Date(departDate)
  returnDate.setDate(returnDate.getDate() + 7)
  const routeKey = `${origin}-${dest.iata}`
  const baseline = BASELINE_PRICES[routeKey] ?? price * 1.5
  const discountPct = Math.round(((baseline - price) / baseline) * 100)

  return {
    origin_iata: origin,
    dest_iata: dest.iata,
    dest_city: dest.city,
    price,
    baseline,
    airline,
    stops: 1,
    is_direct: false,
    trip_type: tripType,
    departure_date: fmt(departDate),
    return_date: tripType !== 'one-way' ? fmt(returnDate) : null,
    google_flights_url: `https://www.google.com/travel/flights?hl=en&gl=in#flt=${origin}.${dest.iata}.${fmt(departDate)}${tripType !== 'one-way' ? `*${dest.iata}.${origin}.${fmt(returnDate)}` : ''};c:INR;e:1;sd:1`,
    discount_pct: discountPct,
    tier: discountPct >= 50 ? 'great' : discountPct >= 30 ? 'good' : 'normal',
    data_source: source,
  }
}

export async function POST(req: NextRequest) {
  const { origin, regions, month, budget, trip_type, max_stops } = await req.json()

  if (!origin) return NextResponse.json({ error: 'Origin required' }, { status: 400 })

  const selectedRegions: string[] = regions?.length ? regions : Object.keys(DESTINATIONS_BY_REGION)
  const destinations = selectedRegions.flatMap(r => DESTINATIONS_BY_REGION[r] ?? []).slice(0, 12)

  let departDate: Date
  if (month && month !== 'anytime') {
    const [y, m] = month.split('-').map(Number)
    departDate = getFirstFridayOfMonth(y, m - 1)
  } else {
    departDate = new Date()
    departDate.setDate(departDate.getDate() + 42)
  }

  const cacheKey = `${origin}-${selectedRegions.join(',')}-${fmt(departDate)}-${trip_type}-${max_stops}`
  const cached = await getCachedResult(cacheKey)
  if (cached) return NextResponse.json({ results: cached, from_cache: true })

  const apiKey = process.env.FLIGHTAPI_KEY
  const results = []
  let apiExhausted = false

  for (const dest of destinations) {
    // 1. Try price_history (pipeline scraped data) first — free, no API call
    const stored = await getStoredPrices(origin, dest.iata)
    if (stored.length >= 3) {
      const avgPrice = Math.round(stored.reduce((s, r) => s + r.observed_price_inr, 0) / stored.length)
      const latest = stored[0]
      results.push(buildResult(origin, dest, avgPrice, latest.airline ?? 'Various', departDate, trip_type ?? 'return', 'supabase'))
      continue
    }

    // 2. Try FlightAPI.io if credits available
    if (apiKey && !apiExhausted) {
      try {
        const live = await fetchFlight(origin, dest.iata, dest.city, departDate, trip_type ?? 'return', max_stops ?? 'one-stop', apiKey)
        if (live) {
          // IMPORTANT: Save to price_history for persistence
          await savePriceHistory(origin, live.dest_iata, live.price, live.airline, live.stops)
          results.push({ ...live, data_source: 'flightapi-io' })
          continue
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('limit') || msg.includes('quota') || msg.includes('credits') || msg.includes('401') || msg.includes('403')) {
          apiExhausted = true
        }
      }
    }

    // 3. Fall back to hardcoded baseline — still useful for Google Flights link
    const routeKey = `${origin}-${dest.iata}`
    const baseline = BASELINE_PRICES[routeKey]
    if (baseline) {
      results.push(buildResult(origin, dest, baseline, 'Check Google Flights', departDate, trip_type ?? 'return', 'baseline'))
    }
  }

  const filtered = results
    .filter(r => !budget || budget === 'any' || r.price <= parseInt(budget))
    .sort((a, b) => b.discount_pct - a.discount_pct)

  await setCachedResult(cacheKey, filtered)

  return NextResponse.json({
    results: filtered,
    from_cache: false,
    api_exhausted: apiExhausted,
    sources: {
      supabase: results.filter(r => r.data_source === 'supabase').length,
      'flightapi-io': results.filter(r => r.data_source === 'flightapi-io').length,
      baseline: results.filter(r => r.data_source === 'baseline').length,
    }
  })
}

export async function GET() {
  return NextResponse.json({ regions: Object.keys(DESTINATIONS_BY_REGION) })
}

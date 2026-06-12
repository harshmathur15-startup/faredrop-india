import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-token') === process.env.ADMIN_SECRET
}

const ORIGINS = [
  { city: 'Delhi', iata: 'DEL' },
  { city: 'Mumbai', iata: 'BOM' },
  { city: 'Bangalore', iata: 'BLR' },
  { city: 'Chennai', iata: 'MAA' },
  { city: 'Hyderabad', iata: 'HYD' },
]

const DESTINATIONS = [
  // Southeast Asia
  { city: 'Bali', iata: 'DPS' },
  { city: 'Bangkok', iata: 'BKK' },
  { city: 'Singapore', iata: 'SIN' },
  { city: 'Kuala Lumpur', iata: 'KUL' },
  { city: 'Phuket', iata: 'HKT' },
  { city: 'Ho Chi Minh City', iata: 'SGN' },
  { city: 'Hanoi', iata: 'HAN' },
  { city: 'Manila', iata: 'MNL' },
  { city: 'Jakarta', iata: 'CGK' },
  // South Asia / Indian Ocean
  { city: 'Male', iata: 'MLE' },
  { city: 'Colombo', iata: 'CMB' },
  { city: 'Kathmandu', iata: 'KTM' },
  // Middle East
  { city: 'Dubai', iata: 'DXB' },
  { city: 'Abu Dhabi', iata: 'AUH' },
  { city: 'Doha', iata: 'DOH' },
  { city: 'Muscat', iata: 'MCT' },
  // East Asia
  { city: 'Tokyo', iata: 'NRT' },
  { city: 'Osaka', iata: 'KIX' },
  { city: 'Seoul', iata: 'ICN' },
  { city: 'Hong Kong', iata: 'HKG' },
  { city: 'Taipei', iata: 'TPE' },
  { city: 'Beijing', iata: 'PEK' },
  // Europe
  { city: 'London', iata: 'LHR' },
  { city: 'Paris', iata: 'CDG' },
  { city: 'Amsterdam', iata: 'AMS' },
  { city: 'Frankfurt', iata: 'FRA' },
  { city: 'Rome', iata: 'FCO' },
  { city: 'Barcelona', iata: 'BCN' },
  { city: 'Zurich', iata: 'ZRH' },
  { city: 'Vienna', iata: 'VIE' },
  { city: 'Istanbul', iata: 'IST' },
  // Americas
  { city: 'New York', iata: 'JFK' },
  { city: 'Los Angeles', iata: 'LAX' },
  { city: 'Toronto', iata: 'YYZ' },
  { city: 'Vancouver', iata: 'YVR' },
  { city: 'San Francisco', iata: 'SFO' },
  // Africa
  { city: 'Nairobi', iata: 'NBO' },
  { city: 'Cape Town', iata: 'CPT' },
  { city: 'Johannesburg', iata: 'JNB' },
  // Australia / Pacific
  { city: 'Sydney', iata: 'SYD' },
  { city: 'Melbourne', iata: 'MEL' },
]

// Hardcoded baselines — calibrated to actual 2025/26 round-trip market prices in INR
const BASELINE_PRICES: Record<string, number> = {
  // DEL routes
  'DEL-DPS': 52000, 'DEL-BKK': 32000, 'DEL-SIN': 38000, 'DEL-KUL': 34000,
  'DEL-HKT': 37000, 'DEL-SGN': 36000, 'DEL-HAN': 35000, 'DEL-MNL': 42000,
  'DEL-CGK': 48000, 'DEL-MLE': 32000, 'DEL-CMB': 20000, 'DEL-KTM': 14000,
  'DEL-DXB': 34000, 'DEL-AUH': 35000, 'DEL-DOH': 33000, 'DEL-MCT': 32000,
  'DEL-NRT': 78000, 'DEL-KIX': 76000, 'DEL-ICN': 72000, 'DEL-HKG': 55000,
  'DEL-TPE': 58000, 'DEL-PEK': 60000,
  'DEL-LHR': 72000, 'DEL-CDG': 74000, 'DEL-AMS': 73000, 'DEL-FRA': 72000,
  'DEL-FCO': 75000, 'DEL-BCN': 76000, 'DEL-ZRH': 78000, 'DEL-VIE': 74000,
  'DEL-IST': 45000,
  'DEL-JFK': 95000, 'DEL-LAX': 98000, 'DEL-YYZ': 90000, 'DEL-YVR': 92000,
  'DEL-SFO': 96000,
  'DEL-NBO': 52000, 'DEL-CPT': 72000, 'DEL-JNB': 68000,
  'DEL-SYD': 88000, 'DEL-MEL': 90000,
  // BOM routes
  'BOM-DPS': 54000, 'BOM-BKK': 35000, 'BOM-SIN': 42000, 'BOM-KUL': 37000,
  'BOM-HKT': 40000, 'BOM-SGN': 38000, 'BOM-HAN': 37000, 'BOM-MNL': 44000,
  'BOM-CGK': 50000, 'BOM-MLE': 25000, 'BOM-CMB': 18000, 'BOM-KTM': 22000,
  'BOM-DXB': 30000, 'BOM-AUH': 31000, 'BOM-DOH': 30000, 'BOM-MCT': 28000,
  'BOM-NRT': 80000, 'BOM-KIX': 78000, 'BOM-ICN': 74000, 'BOM-HKG': 57000,
  'BOM-TPE': 60000, 'BOM-PEK': 62000,
  'BOM-LHR': 75000, 'BOM-CDG': 76000, 'BOM-AMS': 75000, 'BOM-FRA': 74000,
  'BOM-FCO': 77000, 'BOM-BCN': 78000, 'BOM-ZRH': 80000, 'BOM-VIE': 76000,
  'BOM-IST': 47000,
  'BOM-JFK': 97000, 'BOM-LAX': 100000, 'BOM-YYZ': 92000, 'BOM-YVR': 94000,
  'BOM-SFO': 98000,
  'BOM-NBO': 50000, 'BOM-CPT': 70000, 'BOM-JNB': 66000,
  'BOM-SYD': 90000, 'BOM-MEL': 92000,
  // BLR routes
  'BLR-DPS': 50000, 'BLR-BKK': 34000, 'BLR-SIN': 38000, 'BLR-KUL': 35000,
  'BLR-HKT': 38000, 'BLR-SGN': 37000, 'BLR-MNL': 43000, 'BLR-CGK': 49000,
  'BLR-CMB': 16000, 'BLR-MLE': 20000, 'BLR-KTM': 20000,
  'BLR-DXB': 32000, 'BLR-AUH': 33000, 'BLR-DOH': 31000, 'BLR-MCT': 30000,
  'BLR-NRT': 78000, 'BLR-ICN': 72000, 'BLR-HKG': 55000, 'BLR-TPE': 58000,
  'BLR-LHR': 73000, 'BLR-CDG': 75000, 'BLR-AMS': 74000, 'BLR-FRA': 73000,
  'BLR-IST': 46000,
  'BLR-JFK': 96000, 'BLR-LAX': 99000, 'BLR-YYZ': 91000, 'BLR-SFO': 97000,
  'BLR-NBO': 48000, 'BLR-JNB': 65000, 'BLR-SYD': 88000, 'BLR-MEL': 90000,
  // MAA routes
  'MAA-DXB': 30000, 'MAA-SIN': 34000, 'MAA-BKK': 32000, 'MAA-CMB': 14000,
  'MAA-KUL': 30000, 'MAA-MLE': 18000, 'MAA-HKT': 34000, 'MAA-LHR': 70000,
  'MAA-CDG': 72000, 'MAA-FRA': 71000, 'MAA-IST': 44000, 'MAA-DOH': 30000,
  'MAA-JFK': 94000, 'MAA-SYD': 86000, 'MAA-NBO': 46000,
  // HYD routes
  'HYD-DXB': 31000, 'HYD-SIN': 35000, 'HYD-BKK': 32000, 'HYD-KUL': 30000,
  'HYD-LHR': 72000, 'HYD-NRT': 76000, 'HYD-MLE': 22000, 'HYD-CMB': 16000,
  'HYD-CDG': 73000, 'HYD-FRA': 72000, 'HYD-IST': 45000, 'HYD-DOH': 31000,
  'HYD-JFK': 95000, 'HYD-SYD': 87000, 'HYD-JNB': 64000,
}

// Minimum plausible INR round-trip prices — anything below flags as currency glitch
// Rule of thumb: ~15% of baseline is the floor
const MIN_PLAUSIBLE_PRICE: Record<string, number> = {
  // Short-haul (should never be below ~₹5k round trip)
  'DEL-CMB': 5000, 'DEL-KTM': 3500, 'MAA-CMB': 4000, 'BLR-CMB': 4000,
  'DEL-MCT': 7000, 'DEL-MLE': 8000, 'BOM-MLE': 6000,
  // Mid-haul Middle East
  'DEL-DXB': 8000, 'DEL-AUH': 8000, 'DEL-DOH': 8000,
  'BOM-DXB': 7000, 'BOM-DOH': 7000, 'BLR-DXB': 8000,
  'MAA-DXB': 7000, 'HYD-DXB': 7000,
  // SE Asia
  'DEL-SIN': 10000, 'DEL-BKK': 9000, 'DEL-KUL': 9000, 'DEL-DPS': 14000,
  'BOM-SIN': 11000, 'BLR-SIN': 10000,
  // Long-haul Europe
  'DEL-LHR': 22000, 'DEL-CDG': 22000, 'DEL-AMS': 22000, 'DEL-FRA': 22000,
  'BOM-LHR': 23000, 'BLR-LHR': 22000,
  // Long-haul East Asia
  'DEL-NRT': 25000, 'DEL-ICN': 22000, 'DEL-HKG': 18000,
  // Ultra long-haul Americas / Australia
  'DEL-JFK': 30000, 'DEL-LAX': 30000, 'DEL-SYD': 28000,
  'BOM-JFK': 30000, 'BLR-JFK': 30000,
}

type DealTier = 'glitch' | 'exceptional' | 'great' | 'good' | 'normal'

function classifyDeal(price: number, baseline: number, routeKey: string): {
  tier: DealTier
  discountPct: number
  warning: string | null
} {
  const discountPct = Math.round(((baseline - price) / baseline) * 100)
  const minPlausible = MIN_PLAUSIBLE_PRICE[routeKey] ?? baseline * 0.15

  // Currency / glitch detection
  if (price < minPlausible) {
    return {
      tier: 'glitch',
      discountPct,
      warning: `Price ₹${price.toLocaleString('en-IN')} is below minimum plausible (₹${minPlausible.toLocaleString('en-IN')}) — likely wrong currency or airline glitch`,
    }
  }

  if (discountPct >= 90) {
    return { tier: 'glitch', discountPct, warning: `${discountPct}% below baseline — almost certainly a glitch fare or wrong currency` }
  }
  if (discountPct >= 70) {
    return { tier: 'exceptional', discountPct, warning: null }
  }
  if (discountPct >= 50) {
    return { tier: 'great', discountPct, warning: null }
  }
  if (discountPct >= 30) {
    return { tier: 'good', discountPct, warning: null }
  }
  return { tier: 'normal', discountPct, warning: null }
}

const fmt = (d: Date) => d.toISOString().split('T')[0]

// stops: '1' = nonstop only, '2' = max 1 stop
async function fetchPriceForWindow(
  origin: string,
  destIata: string,
  weeksOut: number,
  apiKey: string,
  tripType: '1' | '2' = '1', // 1 = round trip, 2 = one way
  maxStops: '1' | '2' = '2'  // 1 = nonstop, 2 = max 1 stop
): Promise<{ price: number; airline: string; stops: number; is_direct: boolean } | null> {
  const departDate = new Date()
  departDate.setDate(departDate.getDate() + weeksOut * 7)
  const returnDate = new Date(departDate)
  returnDate.setDate(returnDate.getDate() + 7)

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destIata,
    outbound_date: fmt(departDate),
    currency: 'INR',
    hl: 'en',
    gl: 'in',
    type: tripType,
    stops: maxStops,
    api_key: apiKey,
  })

  if (tripType === '1') {
    params.set('return_date', fmt(returnDate))
  }

  const res = await fetch(`https://api.valueserp.com/search?${params}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)

  const flights = [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
  if (!flights.length) return null

  // Filter by max 1 stop on outbound leg
  const filtered = flights.filter(f => {
    const legs = f.flights ?? []
    return legs.length <= 2 // 1 leg = direct, 2 legs = 1 stop
  })

  const best = filtered[0] ?? flights[0]
  const price: number = best.price
  if (!price) return null

  const legs = best.flights ?? []
  const airline: string = legs[0]?.airline ?? best.airlines?.[0] ?? 'Unknown'
  const stops = Math.max(0, legs.length - 1)

  return { price, airline, stops, is_direct: stops === 0 }
}

async function get30DayBaseline(origin: string, destIata: string): Promise<number | null> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabaseAdmin
      .from('route_prices')
      .select('price')
      .eq('origin_iata', origin)
      .eq('dest_iata', destIata)
      .gte('sampled_at', thirtyDaysAgo.toISOString())
      .order('sampled_at', { ascending: false })
      .limit(30)

    if (!data || data.length < 7) return null // Need at least 7 data points

    const avg = data.reduce((sum, r) => sum + r.price, 0) / data.length
    return Math.round(avg)
  } catch {
    return null
  }
}

async function storePriceSample(
  origin: string, destIata: string, price: number, airline: string, departureDate: string
) {
  try {
    await supabaseAdmin.from('route_prices').insert({
      origin_iata: origin,
      dest_iata: destIata,
      price,
      currency: 'INR',
      departure_date: departureDate,
      airline,
    })
  } catch {
    // Non-critical — don't fail the request
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized — wrong password' }, { status: 401 })
  }

  if (!process.env.VALUESERP_KEY) {
    return NextResponse.json({ error: 'VALUESERP_KEY not configured' }, { status: 500 })
  }

  const origin = req.nextUrl.searchParams.get('origin') ?? 'DEL'
  const tripType = (req.nextUrl.searchParams.get('trip_type') ?? '1') as '1' | '2'
  const maxStops = (req.nextUrl.searchParams.get('max_stops') ?? '2') as '1' | '2'
  const apiKey = process.env.VALUESERP_KEY

  // Scan 4 departure windows per route, pick the cheapest
  const DATE_WINDOWS = [4, 8, 12, 16] // weeks out

  // Scan up to 15 destinations per request (uses ~30 SerpAPI calls)
  const results = await Promise.allSettled(
    DESTINATIONS.slice(0, 15).map(async (dest) => {
      const routeKey = `${origin}-${dest.iata}`

      // Fetch all windows in parallel — use only 2 to conserve SerpAPI quota
      const windowResults = await Promise.allSettled(
        DATE_WINDOWS.slice(0, 2).map(w => fetchPriceForWindow(origin, dest.iata, w, apiKey, tripType, maxStops))
      )

      const validResults = windowResults
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<{ price: number; airline: string; stops: number; is_direct: boolean }>).value)

      if (!validResults.length) return null

      // Pick the cheapest window
      const best = validResults.reduce((a, b) => a.price < b.price ? a : b)
      const bestWindowIdx = validResults.indexOf(best)
      const weeksOut = DATE_WINDOWS[bestWindowIdx] ?? 8

      const departDate = new Date()
      departDate.setDate(departDate.getDate() + weeksOut * 7)
      const returnDate = new Date(departDate)
      returnDate.setDate(returnDate.getDate() + 7)

      // Store sample for history
      storePriceSample(origin, dest.iata, best.price, best.airline, fmt(departDate))

      // Use 30-day Supabase average if available, else hardcoded baseline
      const historyBaseline = await get30DayBaseline(origin, dest.iata)
      const baseline = historyBaseline ?? BASELINE_PRICES[routeKey] ?? best.price * 1.6

      const { tier, discountPct, warning } = classifyDeal(best.price, baseline, routeKey)

      return {
        origin_iata: origin,
        dest_iata: dest.iata,
        origin_city: ORIGINS.find(o => o.iata === origin)?.city ?? origin,
        dest_city: dest.city,
        price: best.price,
        baseline,
        currency: 'INR',
        airline: best.airline,
        stops: best.stops,
        is_direct: best.is_direct,
        trip_type: tripType === '1' ? 'return' : 'one-way',
        departure_date: fmt(departDate),
        return_date: tripType === '1' ? fmt(returnDate) : null,
        source_url: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest.iata}`,
        discount_pct: discountPct,
        tier,
        warning,
        using_real_baseline: historyBaseline !== null,
      }
    })
  )

  const suggestions = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean)
    .sort((a, b) => (b?.discount_pct ?? 0) - (a?.discount_pct ?? 0))

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason?.message)

  return NextResponse.json({ suggestions, origin, errors })
}

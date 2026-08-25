import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, rateLimit, clientKey, tooManyRequests } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB request cap
const MAX_ROWS = 5000             // per-request row cap
const RATE_LIMIT = 6              // imports per window
const RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  // AUTH + limits before any parsing/DB work.
  const authErr = requireAdmin(req)
  if (authErr) return authErr
  if (!rateLimit(clientKey(req, 'analytics-import'), RATE_LIMIT, RATE_WINDOW_MS)) {
    return tooManyRequests()
  }
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength && contentLength > MAX_BYTES) {
    return NextResponse.json({ error: `Request too large (max ${MAX_BYTES} bytes)` }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { flights, source = 'flightapi-import' } = body

    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json({ error: 'flights array required' }, { status: 400 })
    }
    if (flights.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS} per request)` }, { status: 413 })
    }

    // Transform and insert flight data into price_history
    const priceHistoryRecords = flights.map((flight: any) => {
      const record: any = {
        origin_iata: flight.origin_iata || flight.departure_airport || flight.from,
        dest_iata: flight.dest_iata || flight.arrival_airport || flight.to,
        airline: flight.airline || flight.airlines?.[0]?.name || 'Unknown',
        observed_price_inr: flight.price || flight.deal_price || flight.cost,
        observed_at: flight.observed_at || flight.date || new Date().toISOString(),
        travel_date: flight.travel_date || flight.observed_at || flight.date || null,
        currency: 'INR',
        source: source,
      }
      // Only include stops/is_direct when provided (columns may not exist yet)
      if (flight.stops !== undefined) record.stops = flight.stops
      if (flight.is_direct !== undefined) record.is_direct = flight.is_direct
      return record
    })

    // Insert in batches of 1000 to avoid timeouts
    const batchSize = 1000
    let importedCount = 0
    const errors = []

    for (let i = 0; i < priceHistoryRecords.length; i += batchSize) {
      const batch = priceHistoryRecords.slice(i, i + batchSize)

      try {
        const { error } = await supabaseAdmin
          .from('price_history')
          .insert(batch)

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else {
          importedCount += batch.length
        }
      } catch (e) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${String(e)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} flight records`,
      importedCount,
      totalAttempted: priceHistoryRecords.length,
      errors: errors.length > 0 ? errors : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to import flight data',
    usage: {
      endpoint: 'POST /api/analytics/import',
      body: {
        flights: [
          {
            origin_iata: 'DEL',
            dest_iata: 'BKK',
            airline: 'IndiGo',
            price: 25000,
            observed_at: '2026-06-13T00:00:00Z',
          }
        ],
        source: 'flightapi-import'
      },
      description: 'Import flight price records from FlightAPI.io or other sources',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getAirport } from '@/lib/airports'

export const dynamic = 'force-dynamic'

const MAX_ALERTS = 10 // per user

async function makeServerClient() {
  const jar = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => jar.set(name, value, options)) } catch { /* readonly ctx */ }
        },
      },
    },
  )
}

async function getSession() {
  const client = await makeServerClient()
  const { data: { session } } = await client.auth.getSession()
  return session
}

// ── GET /api/alerts — list own alerts ────────────────────────────────────────
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('flight_alerts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alerts: data ?? [] })
}

// ── POST /api/alerts — create an alert ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enforce per-user cap
  const { count } = await supabaseAdmin
    .from('flight_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_active', true)

  if ((count ?? 0) >= MAX_ALERTS) {
    return NextResponse.json(
      { error: `You can have up to ${MAX_ALERTS} active alerts. Pause or delete one first.` },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { origin_iata, dest_iata, target_price, cabin_class, trip_type, travel_month, flexible_dates } = body

  // Validate required fields
  if (!origin_iata || !dest_iata || !target_price) {
    return NextResponse.json({ error: 'origin_iata, dest_iata and target_price are required' }, { status: 400 })
  }
  const ori = String(origin_iata).toUpperCase().trim()
  const dst = String(dest_iata).toUpperCase().trim()
  if (ori.length !== 3 || dst.length !== 3) {
    return NextResponse.json({ error: 'IATA codes must be 3 characters' }, { status: 400 })
  }
  if (ori === dst) {
    return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 })
  }
  const price = Number(target_price)
  if (!Number.isFinite(price) || price < 1000 || price > 1_000_000) {
    return NextResponse.json({ error: 'target_price must be between ₹1,000 and ₹10,00,000' }, { status: 400 })
  }

  const VALID_CABINS    = ['economy', 'premium_economy', 'business', 'first'] as const
  const VALID_TRIPS     = ['roundtrip', 'oneway'] as const
  const cabin = VALID_CABINS.includes(cabin_class as typeof VALID_CABINS[number]) ? cabin_class : 'economy'
  const trip  = VALID_TRIPS.includes(trip_type as typeof VALID_TRIPS[number])     ? trip_type  : 'roundtrip'

  const originAirport = getAirport(ori)
  const destAirport   = getAirport(dst)

  // Validate travel_month format (YYYY-MM)
  const month = travel_month && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(travel_month))
    ? String(travel_month)
    : null

  const { data, error } = await supabaseAdmin
    .from('flight_alerts')
    .insert({
      user_id:        session.user.id,
      origin_iata:    ori,
      dest_iata:      dst,
      origin_city:    originAirport?.city ?? ori,
      dest_city:      destAirport?.city   ?? dst,
      target_price:   Math.round(price),
      cabin_class:    cabin,
      trip_type:      trip,
      travel_month:   month,
      flexible_dates: Boolean(flexible_dates),
      is_active:      true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data }, { status: 201 })
}

// ── PATCH /api/alerts — pause, resume, or edit ───────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id, is_active, target_price, travel_month } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof is_active === 'boolean') patch.is_active = is_active
  if (typeof target_price === 'number' && target_price >= 1000) patch.target_price = Math.round(target_price)
  if (travel_month !== undefined) {
    patch.travel_month = travel_month && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(travel_month))
      ? travel_month : null
  }

  const { data, error } = await supabaseAdmin
    .from('flight_alerts')
    .update(patch)
    .eq('id', String(id))
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data })
}

// ── DELETE /api/alerts?id=… — delete one alert ───────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('flight_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

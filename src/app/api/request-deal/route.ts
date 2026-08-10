import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDealRequestEmail, DealRequest } from '@/lib/email'

export const dynamic = 'force-dynamic'

async function getUserId(): Promise<string | null> {
  try {
    const jar = await cookies()
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => jar.getAll(), setAll: () => {} } },
    )
    const { data: { session } } = await client.auth.getSession()
    return session?.user.id ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const request: DealRequest = {
    email: s(body.email),
    name: s(body.name) || undefined,
    departure_month: s(body.departure_month),
    trip_scope: s(body.trip_scope),
    trip_duration_days: body.trip_duration_days != null && body.trip_duration_days !== ''
      ? Number(body.trip_duration_days) : null,
    origin_city: s(body.origin_city) || undefined,
    dest_city: s(body.dest_city),
    dest_country: s(body.dest_country),
    trip_type: s(body.trip_type),
    notes: s(body.notes) || undefined,
  }

  // Required fields
  const missing = (['email', 'departure_month', 'trip_scope', 'dest_city', 'dest_country', 'trip_type'] as const)
    .filter(k => !request[k])
  if (missing.length) {
    return NextResponse.json({ error: `Missing: ${missing.join(', ')}` }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(request.email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
  }

  const userId = await getUserId()

  // Best-effort persistence (table may not exist yet — don't block the request).
  try {
    await supabaseAdmin.from('deal_requests').insert({
      user_id: userId,
      email: request.email,
      name: request.name ?? null,
      departure_month: request.departure_month,
      trip_scope: request.trip_scope,
      trip_duration_days: request.trip_duration_days,
      origin_city: request.origin_city ?? null,
      dest_city: request.dest_city,
      dest_country: request.dest_country,
      trip_type: request.trip_type,
      notes: request.notes ?? null,
    })
  } catch { /* table missing / RLS — email still goes out below */ }

  // Notify the team (primary delivery).
  try {
    await sendDealRequestEmail(request)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not send request.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

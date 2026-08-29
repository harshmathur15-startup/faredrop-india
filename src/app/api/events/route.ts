import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// First-party product analytics sink. Fire-and-forget from the client: it never
// blocks a page and never surfaces an error to the user. Accepts a single event
// or a batch: { events: [ ... ] }. Anonymous events (no auth) are allowed and
// grouped by anon_id. See supabase/migrations/*_analytics_events.sql.

const EVENT_TYPES = new Set([
  'impression', 'click', 'page_view',
  'checkout_started', 'payment_success', 'checkout_abandoned', 'checkout_failed',
])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_EVENTS = 50

type RawEvent = Record<string, unknown>

function clean(e: RawEvent, userId: string | null) {
  const type = typeof e.type === 'string' ? e.type : ''
  if (!EVENT_TYPES.has(type)) return null

  const str = (v: unknown, max = 200) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
  const int = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  const dealId = str(e.deal_id, 64)

  return {
    event_type: type,
    user_id: userId,
    anon_id: str(e.anon_id, 64),
    deal_id: dealId && UUID_RE.test(dealId) ? dealId : null,
    surface: str(e.surface, 32),
    position: int(e.position),
    page: str(e.page, 300),
    dwell_ms: e.dwell_ms == null ? null : Math.max(0, int(e.dwell_ms) ?? 0),
    tier: str(e.tier, 16),
    meta: e.meta && typeof e.meta === 'object' ? e.meta : null,
  }
}

export async function POST(req: NextRequest) {
  let body: RawEvent
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const list: RawEvent[] = Array.isArray(body.events)
    ? (body.events as RawEvent[])
    : [body]
  if (list.length === 0 || list.length > MAX_EVENTS) {
    return NextResponse.json({ ok: false, error: 'bad batch size' }, { status: 400 })
  }

  // Best-effort identity: Bearer token (sessions live in localStorage) or cookie.
  const userId = await getUserId(req).catch(() => null)

  const rows = list
    .map(e => clean(e, userId))
    .filter((r): r is NonNullable<typeof r> => r !== null)
  if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

  const { error } = await supabaseAdmin.from('analytics_events').insert(rows)
  if (error) {
    // Never fail loudly — analytics must not degrade the product.
    return NextResponse.json({ ok: false }, { status: 202 })
  }
  return NextResponse.json({ ok: true, inserted: rows.length })
}

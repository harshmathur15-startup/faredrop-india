import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { type ProtectedDeal } from '@/lib/deal-access'
import { getEntitlement } from '@/lib/deal-entitlement'
import { buildDealGoogleUrl } from '@/lib/deal-links'
import { tripFromNote, cabinFromNote, stopsFromNote } from '@/lib/utils'
import type { Deal } from '@/types'

export const dynamic = 'force-dynamic'

// Returns the MEMBER-ONLY deal details (exact dates, airline, flight legs, booking
// link) — and ONLY to an entitled viewer. The enforcement lives here, server-side:
// guests get 401, un-unlocked free users get 403, and neither receives any
// protected field. Never cached by shared/CDN caches.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' }

  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', id)
    .maybeSingle<Deal>()

  if (!deal || deal.status !== 'published') {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers })
  }

  const userId = await getUserId(req)
  const ent = await getEntitlement(userId, id)

  if (!ent.entitled) {
    // No protected fields in the body — only enough for the client to show the
    // right call-to-action (sign up vs unlock vs upgrade).
    return NextResponse.json(
      { entitled: false, reason: ent.reason },
      { status: ent.authed ? 403 : 401, headers },
    )
  }

  const details: ProtectedDeal = {
    airline: deal.airline,
    validity_start: deal.validity_start,
    validity_end: deal.validity_end,
    trip: tripFromNote(deal.curator_note),
    cabin: cabinFromNote(deal.curator_note) ?? 'Economy',
    stops: stopsFromNote(deal.curator_note),
    note: deal.curator_note,
    google_url: buildDealGoogleUrl(deal),
  }

  return NextResponse.json({ entitled: true, deal: details }, { headers })
}

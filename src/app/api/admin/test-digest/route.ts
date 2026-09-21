/**
 * Admin-only: send a test "new deals" digest to a single address (does NOT
 * broadcast to subscribers). Uses the same sendDealDigestEmail the discovery
 * agent uses, over the latest N published deals.
 *
 *   GET /api/admin/test-digest?to=you@example.com&limit=6
 *   header: x-admin-token: <ADMIN_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-guard'
import { sendDealDigestEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  const to = req.nextUrl.searchParams.get('to')
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 6) || 6, 20)
  if (!to || !to.includes('@')) {
    return NextResponse.json({ error: 'Provide ?to=<email>' }, { status: 400 })
  }

  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('id, origin_city, dest_city, airline, deal_price, normal_price, validity_start, validity_end')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deals || !deals.length) return NextResponse.json({ error: 'No published deals to send' }, { status: 404 })

  try {
    // digest lists cheapest-first, like the real one
    const ordered = [...deals].sort((a, b) => a.deal_price - b.deal_price)
    await sendDealDigestEmail({ to, deals: ordered })
    return NextResponse.json({ ok: true, sent_to: to, deals: ordered.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

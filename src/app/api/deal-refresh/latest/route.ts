/**
 * Public, read-only summary of the most recent daily deal-price refresh.
 * Returns only non-sensitive info (route codes, prices, counts) already visible
 * on the public deals site. Consumed by the Claude routine that pushes the
 * morning update to the Claude mobile app. No secret required.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('deal_refresh_runs')
    .select('ran_at, summary')
    .order('ran_at', { ascending: false })
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ ran: false, message: 'No deal refresh has run yet.' })
  }

  const { ran_at, summary } = data[0]
  const ageHours = (Date.now() - new Date(ran_at).getTime()) / 3_600_000
  return NextResponse.json({ ran: true, ran_at, stale: ageHours > 26, age_hours: Math.round(ageHours * 10) / 10, summary })
}

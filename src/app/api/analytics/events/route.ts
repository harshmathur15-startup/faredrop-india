import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

// Engagement analytics for the admin dashboard: runs the four analytics_events
// reporting functions (deal performance, page dwell, checkout funnel, first
// clicks) over a lookback window. Admin-token guarded, service-role RPCs.
export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  const url = new URL(req.url)
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') ?? '30', 10) || 30))

  try {
    const [perf, dwell, funnel, firstClicks] = await Promise.all([
      supabaseAdmin.rpc('analytics_deal_performance', { p_days: days }),
      supabaseAdmin.rpc('analytics_page_dwell', { p_days: days }),
      supabaseAdmin.rpc('analytics_checkout_funnel', { p_days: days }),
      supabaseAdmin.rpc('analytics_first_deal_click', { p_days: days }),
    ])

    const firstError = [perf, dwell, funnel, firstClicks].find(r => r.error)?.error
    if (firstError) {
      // Most likely the migration hasn't been applied to this DB yet.
      return NextResponse.json({ error: firstError.message }, { status: 500 })
    }

    return NextResponse.json({
      days,
      dealPerformance: perf.data ?? [],
      pageDwell: dwell.data ?? [],
      checkoutFunnel: funnel.data ?? null,
      firstClicks: firstClicks.data ?? [],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

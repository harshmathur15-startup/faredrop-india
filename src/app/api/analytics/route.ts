import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'
import { getCached, setCached } from '@/lib/ttl-cache'

export const dynamic = 'force-dynamic'

const SUMMARY_CACHE_KEY = 'analytics_summary'
const SUMMARY_TTL_MS = 10 * 60 * 1000 // 10 min server-side cache

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(500, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '100', 10) || 100))

    // 1. Aggregates — computed in Postgres, cached in-memory for 10 min.
    let summary = getCached<Record<string, unknown>>(SUMMARY_CACHE_KEY)
    let cached = true
    if (!summary) {
      const { data, error } = await supabaseAdmin.rpc('analytics_summary')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      summary = (data ?? {}) as Record<string, unknown>
      setCached(SUMMARY_CACHE_KEY, summary, SUMMARY_TTL_MS)
      cached = false
    }

    // 2. Paginated deal listing — only the requested page, minimal columns.
    const from = (page - 1) * pageSize
    const { data: deals, count } = await supabaseAdmin
      .from('deals')
      .select(
        'id, origin_iata, dest_iata, origin_city, dest_city, airline, deal_price, normal_price, status, validity_start, validity_end, curator_note, last_verified_at',
        { count: 'exact' },
      )
      .order('deal_price', { ascending: true })
      .range(from, from + pageSize - 1)

    const allDeals = (deals ?? []).map((d: Record<string, unknown>) => {
      const normal = Number(d.normal_price) || 0
      const deal = Number(d.deal_price) || 0
      return {
        id: d.id,
        route: `${d.origin_iata}-${d.dest_iata}`,
        origin: d.origin_city,
        destination: d.dest_city,
        airline: d.airline,
        dealPrice: d.deal_price,
        normalPrice: d.normal_price,
        discount: normal > 0 ? Math.round(((normal - deal) / normal) * 100) : null,
        status: d.status,
        validFrom: d.validity_start,
        validTo: d.validity_end,
        last_verified_at: d.last_verified_at ?? null,
        curator_note: typeof d.curator_note === 'string' ? d.curator_note.substring(0, 50) : '',
      }
    })

    const s = summary as Record<string, unknown>
    return NextResponse.json({
      recordCounts: s.recordCounts,
      stats: {
        deals: s.deals,
        dealPrices: s.dealPrices,
        normalPrices: s.normalPrices,
        allHistoricalPrices: s.allHistoricalPrices,
        dataCompleteness: s.dataCompleteness,
        routes: s.routes,
      },
      freshness: s.freshness,
      lowestDeal: s.lowestDeal ?? null,
      highestDeal: s.highestDeal ?? null,
      allDeals,
      pagination: { page, pageSize, total: count ?? 0 },
      priceHistoryCount: (s.recordCounts as { totalPriceHistory?: number })?.totalPriceHistory ?? 0,
      lastUpdated: s.lastUpdated ?? new Date().toISOString(),
      cached,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

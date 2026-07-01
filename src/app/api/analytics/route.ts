import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Get all deals (no limit, fetch everything)
    const { data: deals, error: dealsError, count: dealsCount } = await supabaseAdmin
      .from('deals')
      .select('*', { count: 'exact' })
      .order('deal_price', { ascending: true })

    if (dealsError) throw dealsError

    // 2. Get all price history (no limit, fetch everything)
    const { data: priceHistory, error: priceError, count: priceCount } = await supabaseAdmin
      .from('price_history')
      .select('*', { count: 'exact' })
      .order('observed_at', { ascending: false })

    if (priceError) throw priceError

    // 3. Calculate statistics
    const dealPrices = deals?.map((d: any) => d.deal_price).filter(Boolean) || []
    const normalPrices = deals?.map((d: any) => d.normal_price).filter(Boolean) || []
    const historyPrices = priceHistory?.map((p: any) => p.observed_price_inr).filter(Boolean) || []
    const allPrices = [...dealPrices, ...normalPrices, ...historyPrices]

    const stats = {
      deals: {
        total: deals?.length || 0,
        published: deals?.filter((d: any) => d.status === 'published').length || 0,
        draft: deals?.filter((d: any) => d.status === 'draft').length || 0,
        archived: deals?.filter((d: any) => d.status === 'archived').length || 0,
      },
      dealPrices: {
        min: dealPrices.length > 0 ? Math.min(...dealPrices) : null,
        max: dealPrices.length > 0 ? Math.max(...dealPrices) : null,
        avg: dealPrices.length > 0 ? Math.round(dealPrices.reduce((a: number, b: number) => a + b) / dealPrices.length) : null,
        count: dealPrices.length,
      },
      normalPrices: {
        min: normalPrices.length > 0 ? Math.min(...normalPrices) : null,
        max: normalPrices.length > 0 ? Math.max(...normalPrices) : null,
        avg: normalPrices.length > 0 ? Math.round(normalPrices.reduce((a: number, b: number) => a + b) / normalPrices.length) : null,
        count: normalPrices.length,
      },
      allHistoricalPrices: {
        min: historyPrices.length > 0 ? Math.min(...historyPrices) : null,
        max: historyPrices.length > 0 ? Math.max(...historyPrices) : null,
        avg: historyPrices.length > 0 ? Math.round(historyPrices.reduce((a: number, b: number) => a + b) / historyPrices.length) : null,
        count: historyPrices.length,
      },
      dataCompleteness: {
        deals_with_images: deals?.filter((d: any) => d.image_url).length || 0,
        deals_with_notes: deals?.filter((d: any) => d.curator_note).length || 0,
        deals_with_airlines: deals?.filter((d: any) => d.airline).length || 0,
        deals_missing_prices: deals?.filter((d: any) => !d.deal_price || !d.normal_price).length || 0,
      },
      routes: {
        unique_routes: deals?.length || 0,
        origins: [...new Set(deals?.map((d: any) => d.origin_iata))].length || 0,
        destinations: [...new Set(deals?.map((d: any) => d.dest_iata))].length || 0,
      },
    }

    // 4. Get lowest and highest individual deals
    const lowestDeal = deals?.reduce((min: any, d: any) => (!min || d.deal_price < min.deal_price) ? d : min, null)
    const highestDeal = deals?.reduce((max: any, d: any) => (!max || d.deal_price > max.deal_price) ? d : max, null)

    // 5. FRESHNESS ANALYSIS — group price_history by route, find latest observation per route
    const FRESH_HOURS = 6
    const AGING_HOURS = 24
    const now = Date.now()
    const HOUR = 60 * 60 * 1000

    const routeMap = new Map<string, { latest: number; price: number; airline: string; count: number; source: string }>()
    for (const p of priceHistory ?? []) {
      const key = `${p.origin_iata}-${p.dest_iata}`
      const ts = p.observed_at ? new Date(p.observed_at).getTime() : 0
      const existing = routeMap.get(key)
      if (!existing || ts > existing.latest) {
        routeMap.set(key, {
          latest: ts,
          price: p.observed_price_inr,
          airline: p.airline ?? 'Unknown',
          count: (existing?.count ?? 0) + 1,
          source: p.source ?? 'unknown',
        })
      } else {
        existing.count += 1
      }
    }

    const classify = (ageHours: number) =>
      ageHours < FRESH_HOURS ? 'fresh' : ageHours < AGING_HOURS ? 'aging' : 'stale'

    const routeFreshness = Array.from(routeMap.entries()).map(([route, info]) => {
      const ageHours = info.latest ? (now - info.latest) / HOUR : Infinity
      return {
        route,
        lastChecked: info.latest ? new Date(info.latest).toISOString() : null,
        ageHours: isFinite(ageHours) ? Math.round(ageHours * 10) / 10 : null,
        freshness: classify(ageHours),
        price: info.price,
        airline: info.airline,
        observations: info.count,
        source: info.source,
      }
    }).sort((a, b) => (b.ageHours ?? Infinity) - (a.ageHours ?? Infinity))

    const freshness = {
      thresholds: { freshHours: FRESH_HOURS, agingHours: AGING_HOURS },
      summary: {
        fresh: routeFreshness.filter(r => r.freshness === 'fresh').length,
        aging: routeFreshness.filter(r => r.freshness === 'aging').length,
        stale: routeFreshness.filter(r => r.freshness === 'stale').length,
        totalRoutes: routeFreshness.length,
      },
      routes: routeFreshness,
    }

    return NextResponse.json({
      recordCounts: {
        totalDeals: dealsCount || deals?.length || 0,
        totalPriceHistory: priceCount || priceHistory?.length || 0,
        totalRecords: (dealsCount || deals?.length || 0) + (priceCount || priceHistory?.length || 0),
      },
      stats,
      freshness,
      lowestDeal: lowestDeal ? {
        route: `${lowestDeal.origin_city} → ${lowestDeal.dest_city}`,
        airline: lowestDeal.airline,
        dealPrice: lowestDeal.deal_price,
        normalPrice: lowestDeal.normal_price,
        discount: lowestDeal.discount_percentage,
        dates: `${lowestDeal.validity_start} to ${lowestDeal.validity_end}`,
      } : null,
      highestDeal: highestDeal ? {
        route: `${highestDeal.origin_city} → ${highestDeal.dest_city}`,
        airline: highestDeal.airline,
        dealPrice: highestDeal.deal_price,
        normalPrice: highestDeal.normal_price,
        discount: highestDeal.discount_percentage,
        dates: `${highestDeal.validity_start} to ${highestDeal.validity_end}`,
      } : null,
      allDeals: deals?.map((d: any) => ({
        id: d.id,
        route: `${d.origin_iata}-${d.dest_iata}`,
        origin: d.origin_city,
        destination: d.dest_city,
        airline: d.airline,
        dealPrice: d.deal_price,
        normalPrice: d.normal_price,
        discount: d.discount_percentage,
        status: d.status,
        validFrom: d.validity_start,
        validTo: d.validity_end,
        curator_note: d.curator_note?.substring(0, 50) + '...',
      })) || [],
      priceHistoryCount: priceHistory?.length || 0,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  try {
    // Head-only counts (no row data pulled) for the tables that actually exist.
    const tables = ['flight_itineraries', 'deals', 'price_history', 'route_prices', 'route_price_daily', 'explore_cache', 'subscribers']
    const results: any = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })

        results[table] = {
          recordCount: count || 0,
          error: error ? error.message : null,
        }
      } catch (e) {
        results[table] = {
          recordCount: 0,
          error: String(e),
        }
      }
    }

    return NextResponse.json({
      tables: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

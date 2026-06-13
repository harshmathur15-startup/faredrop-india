import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all explore cache data
    const { data: cache, count, error } = await supabaseAdmin
      .from('explore_cache')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) throw error

    // Parse the cached results to count individual flight records
    let totalFlightRecords = 0
    const cacheDetails = cache?.map((c: any) => {
      let resultCount = 0
      try {
        if (c.results && Array.isArray(c.results)) {
          resultCount = c.results.length
          totalFlightRecords += resultCount
        }
      } catch (e) {
        // Results might be JSON string
        if (typeof c.results === 'string') {
          try {
            const parsed = JSON.parse(c.results)
            if (Array.isArray(parsed)) {
              resultCount = parsed.length
              totalFlightRecords += resultCount
            }
          } catch {}
        }
      }
      return {
        cache_key: c.cache_key,
        resultCount,
        createdAt: c.created_at,
      }
    }) || []

    return NextResponse.json({
      totalCacheEntries: count || 0,
      totalFlightRecords,
      cacheDetails,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

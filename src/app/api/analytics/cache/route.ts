import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  try {
    // Get explore cache metadata (results included only to count entries).
    const { data: cache, count, error } = await supabaseAdmin
      .from('explore_cache')
      .select('cache_key, created_at, results', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200)

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

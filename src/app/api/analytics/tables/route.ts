import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check all tables for record counts
    const tables = ['deals', 'price_history', 'explore_cache', 'email_subscribers']
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

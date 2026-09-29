/**
 * Notify subscribers of newly published deals.
 * Picks up any published deal where notified_at IS NULL (covers both
 * manually-published and auto-published deals). Sends WhatsApp to opted-in
 * users and email to confirmed subscribers, then stamps notified_at.
 * Runs daily at 10:00 UTC (3:30 PM IST) — after the auto-publish cron.
 * Protected by CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyDealPublished } from '@/lib/notifications'
import type { Deal } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Fetch published deals not yet notified, published within the last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('status', 'published')
    .is('notified_at', null)
    .gte('published_at', since)
    .order('published_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deals?.length) return NextResponse.json({ ok: true, notified: 0, message: 'No new deals to notify' })

  const results = []
  for (const deal of deals) {
    try {
      const summary = await notifyDealPublished(deal as Deal)
      results.push({ dealId: deal.id, route: `${deal.origin_iata}→${deal.dest_iata}`, ...summary })
    } catch (err) {
      results.push({ dealId: deal.id, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, notified: deals.length, results })
}

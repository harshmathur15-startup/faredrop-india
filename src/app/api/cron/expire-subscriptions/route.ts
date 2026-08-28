/**
 * Subscription re-lock cron.
 * Downgrades users whose subscription has lapsed: paid tier but
 * subscription_expires_at is in the past. Runs daily (see vercel.json).
 * Protected by CRON_SECRET (same pattern as check-alerts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const nowIso = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .update({ subscription_tier: 'free', subscription_status: 'expired', updated_at: nowIso })
    .neq('subscription_tier', 'free')
    .not('subscription_expires_at', 'is', null)
    .lt('subscription_expires_at', nowIso)
    .select('user_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, downgraded: data?.length ?? 0 })
}

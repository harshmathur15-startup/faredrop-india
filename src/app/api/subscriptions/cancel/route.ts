import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRazorpay, razorpayConfigured } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// POST /api/subscriptions/cancel
// Cancels the user's active subscription at the end of the current cycle, so
// access continues until the paid period ends (RBI-friendly). The final
// downgrade to 'free' happens via the re-lock cron once expiry passes.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!razorpayConfigured()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  const { data: pref } = await supabaseAdmin
    .from('user_preferences')
    .select('razorpay_subscription_id, subscription_status')
    .eq('user_id', userId)
    .maybeSingle()

  const subId = pref?.razorpay_subscription_id
  if (!subId) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })

  try {
    // cancel_at_cycle_end = true → keep access until the period ends.
    await getRazorpay().subscriptions.cancel(subId, true)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Cancellation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  await supabaseAdmin
    .from('user_preferences')
    .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return NextResponse.json({ ok: true, status: 'cancelled', note: 'Access continues until the period ends.' })
}

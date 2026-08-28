import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getUserId } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRazorpay, isTier } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// POST /api/subscriptions/verify
// Called from the checkout success handler for a subscription. For
// subscriptions the signature is HMAC(payment_id + '|' + subscription_id).
// Grants the tier immediately; the webhook is the authoritative backstop.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  let body: {
    razorpay_payment_id?: string
    razorpay_subscription_id?: string
    razorpay_signature?: string
    tier?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !isTier(body.tier)) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }

  // Subscription signature = HMAC(payment_id + '|' + subscription_id)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex')

  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))
  if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

  // Fetch current_end to set an accurate expiry (fallback: leave null, webhook fills it).
  let expiresAt: string | null = null
  try {
    const sub = await getRazorpay().subscriptions.fetch(razorpay_subscription_id)
    if (sub?.current_end) expiresAt = new Date(sub.current_end * 1000).toISOString()
  } catch { /* webhook will backfill expiry */ }

  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        subscription_tier: body.tier,
        razorpay_subscription_id,
        subscription_status: 'active',
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tier: body.tier })
}

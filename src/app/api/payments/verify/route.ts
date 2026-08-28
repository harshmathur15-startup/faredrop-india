import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getUserId } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'
import { isTier } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// POST /api/payments/verify
// Called from the Razorpay checkout success handler. Verifies the HMAC
// signature, then grants the tier. This gives instant unlock; the webhook is
// the authoritative backstop if the browser closes before this runs.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  let body: {
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
    tier?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !isTier(body.tier)) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  // timing-safe compare
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))

  if (!valid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: userId, subscription_tier: body.tier, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tier: body.tier })
}

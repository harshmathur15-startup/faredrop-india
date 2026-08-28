import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-server'
import { getRazorpay, razorpayConfigured, amountPaise, isTier } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// POST /api/payments/create-order  { tier: 'silver'|'gold', annual: boolean }
// Creates a Razorpay order for the chosen plan and returns the fields the
// client checkout needs. The tier is granted only after signature/webhook
// verification — never here.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!razorpayConfigured()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  let body: { tier?: string; annual?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!isTier(body.tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }
  const annual = Boolean(body.annual)
  const amount = amountPaise(body.tier, annual)
  const cycle = annual ? 'annual' : 'monthly'

  try {
    const order = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: `sub_${body.tier}_${userId.slice(0, 8)}_${Date.now()}`,
      // notes are echoed back on the webhook payload — used to grant the tier.
      notes: { user_id: userId, tier: body.tier, cycle },
    })

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      tier: body.tier,
      cycle,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Order creation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

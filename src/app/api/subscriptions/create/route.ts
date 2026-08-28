import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth-server'
import { getRazorpay, razorpayConfigured, isTier } from '@/lib/razorpay'
import { planId, TOTAL_COUNT } from '@/lib/razorpay-plans'

export const dynamic = 'force-dynamic'

// POST /api/subscriptions/create  { tier: 'silver'|'gold', annual: boolean }
// Creates a Razorpay Subscription (recurring). Returns the subscription_id for
// the checkout. The tier is granted only after signature/webhook verification.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!razorpayConfigured()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  let body: { tier?: string; annual?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!isTier(body.tier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  const annual = Boolean(body.annual)
  const cycle = annual ? 'annual' : 'monthly'

  // First-cycle intro offer (e.g. Silver monthly: ₹1 first month, then ₹199/mo).
  // Created in the Razorpay Dashboard; its id is env-driven so test/live swap
  // without a code change. Only applied to Silver monthly.
  const introOffer =
    body.tier === 'silver' && !annual
      ? process.env.RAZORPAY_SILVER_MONTHLY_OFFER_ID
      : undefined

  try {
    type CreateParams = Parameters<ReturnType<typeof getRazorpay>['subscriptions']['create']>[0]
    const params = {
      plan_id: planId(body.tier, annual),
      total_count: TOTAL_COUNT[cycle],
      customer_notify: 1, // Razorpay emails the invoice/receipt each cycle
      notes: { user_id: userId, tier: body.tier, cycle },
    } as CreateParams & { offer_id?: string }
    if (introOffer) params.offer_id = introOffer

    const subscription = await getRazorpay().subscriptions.create(params)

    return NextResponse.json({
      subscription_id: subscription.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      tier: body.tier,
      cycle,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Subscription creation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

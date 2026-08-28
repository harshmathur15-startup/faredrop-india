import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { isTier } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// POST /api/webhooks/razorpay
// Authoritative grant/renew/downgrade path. Configure in Razorpay Dashboard →
// Webhooks with RAZORPAY_WEBHOOK_SECRET and these events:
//   subscription.charged   → grant/renew (extend expiry)
//   subscription.activated → grant
//   subscription.halted    → mark halted (cron downgrades at expiry)
//   subscription.cancelled → mark cancelled (cron downgrades at expiry)
//   payment.captured       → (one-time fallback) grant from order notes
// Verifies the signature over the RAW body. Idempotent (upsert/update).
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  interface SubEntity {
    id?: string
    current_end?: number
    notes?: Record<string, string>
  }
  let event: {
    event?: string
    payload?: {
      subscription?: { entity?: SubEntity }
      payment?: { entity?: { notes?: Record<string, string> } }
      order?: { entity?: { notes?: Record<string, string> } }
    }
  }
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const type = event.event ?? ''
  const sub = event.payload?.subscription?.entity

  // ── Subscription grant / renew ────────────────────────────────────────────
  if (type === 'subscription.charged' || type === 'subscription.activated') {
    const notes = sub?.notes ?? {}
    if (!notes.user_id || !isTier(notes.tier)) {
      return NextResponse.json({ ok: true, skipped: 'missing user_id/tier in notes' })
    }
    const expiresAt = sub?.current_end ? new Date(sub.current_end * 1000).toISOString() : null
    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert(
        {
          user_id: notes.user_id,
          subscription_tier: notes.tier,
          razorpay_subscription_id: sub?.id ?? null,
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, renewed: notes.tier })
  }

  // ── Subscription halted / cancelled → mark status; cron re-locks at expiry ─
  if (type === 'subscription.halted' || type === 'subscription.cancelled') {
    if (sub?.id) {
      const status = type === 'subscription.halted' ? 'halted' : 'cancelled'
      const { error } = await supabaseAdmin
        .from('user_preferences')
        .update({ subscription_status: status, updated_at: new Date().toISOString() })
        .eq('razorpay_subscription_id', sub.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, status: type })
  }

  // ── One-time payment fallback (non-subscription orders) ────────────────────
  if (type === 'payment.captured' || type === 'order.paid') {
    const notes =
      event.payload?.payment?.entity?.notes ??
      event.payload?.order?.entity?.notes ??
      {}
    if (!notes.user_id || !isTier(notes.tier)) {
      return NextResponse.json({ ok: true, skipped: 'no subscription; missing notes' })
    }
    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert(
        { user_id: notes.user_id, subscription_tier: notes.tier, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, granted: notes.tier })
  }

  // Acknowledge everything else so Razorpay doesn't retry.
  return NextResponse.json({ ok: true, ignored: type })
}

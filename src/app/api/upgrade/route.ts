import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { razorpayConfigured } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

async function makeServerClient() {
  const jar = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => jar.set(name, value, options)) } catch { /* readonly ctx */ }
        },
      },
    },
  )
}

// Sessions live in localStorage (Bearer token), with a cookie-session fallback.
async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && data.user) return data.user.id
  }
  const client = await makeServerClient()
  const { data: { session } } = await client.auth.getSession()
  return session?.user.id ?? null
}

// FALLBACK-ONLY no-payment unlock.
// Grants the chosen tier immediately with NO payment. This is a free-premium
// backdoor, so it is DISABLED whenever Razorpay is configured — it only stays
// live as a fallback when the payment gateway isn't set up. The frontend calls
// this only when /api/payments/create-order returns 503 (not configured).
export async function POST(req: NextRequest) {
  // Payments live → this endpoint is closed. Real unlocks go through checkout.
  if (razorpayConfigured()) {
    return NextResponse.json(
      { error: 'Payments are live — use checkout.' },
      { status: 403 },
    )
  }

  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { tier?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const tier = body.tier
  if (tier !== 'silver' && tier !== 'gold') {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: userId, subscription_tier: tier, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tier })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyWelcome } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { email, name, phone, userId, whatsapp_number, whatsapp_opted_in } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Upsert subscriber — OTP-verified so mark confirmed immediately
  const { data: existing } = await supabaseAdmin
    .from('subscribers')
    .select('id')
    .eq('email', String(email))
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from('subscribers')
      .update({ confirmed: true, last_active_at: new Date().toISOString() })
      .eq('email', String(email))
  } else {
    await supabaseAdmin.from('subscribers').insert({
      email:     String(email),
      source:    'otp-login',
      confirmed: true,
    })
  }

  // Send welcome notifications (non-fatal — don't fail the signup if this errors)
  if (name && userId) {
    notifyWelcome({
      userId:          String(userId),
      email:           String(email),
      name:            String(name),
      whatsappNumber:  whatsapp_opted_in && whatsapp_number ? String(whatsapp_number) : null,
      whatsappOptedIn: Boolean(whatsapp_opted_in),
    }).catch((err: Error) => console.error('[complete-signup] welcome notification failed:', err.message))
  }

  return NextResponse.json({ ok: true })
}

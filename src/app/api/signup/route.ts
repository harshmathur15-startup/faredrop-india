import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function getResend() {
  return new (require('resend').Resend)(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  const { email, source } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('subscribers')
    .select('id, confirmed')
    .eq('email', email)
    .single()

  if (existing?.confirmed) {
    return NextResponse.json({ message: 'Already subscribed!' })
  }

  if (!existing) {
    const { error } = await supabaseAdmin.from('subscribers').insert({
      email,
      source: source ?? null,
      confirmed: false,
    })
    if (error) return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://travelbaby.in'

  const confirmUrl = `${baseUrl}/api/confirm?email=${encodeURIComponent(email)}`

  try {
    const resend = getResend()
    await resend.emails.send({
      from: `Travelbaby <${process.env.FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
      to: email,
      subject: 'Confirm your Travelbaby subscription',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1d4ed8">✈️ Travelbaby</h2>
          <p>Thanks for signing up! Click below to confirm your email and start receiving curated flight deals.</p>
          <a href="${confirmUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Confirm my subscription →
          </a>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">
            You'll get 1–2 curated deals per week — only when prices drop 40%+. No spam.
          </p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Email send failed:', emailErr)
    // Subscriber is saved — email failure is non-fatal
  }

  return NextResponse.json({ message: 'Check your inbox!' })
}

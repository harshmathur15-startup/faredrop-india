import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://travelbaby.in'

  const email = req.nextUrl.searchParams.get('email')

  if (!email) return NextResponse.redirect(`${base}/?error=invalid`)

  await supabaseAdmin
    .from('subscribers')
    .update({ confirmed: true, last_active_at: new Date().toISOString() })
    .eq('email', email)

  return NextResponse.redirect(`${base}/?confirmed=1`)
}

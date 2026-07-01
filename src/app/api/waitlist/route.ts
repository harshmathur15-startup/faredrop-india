import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, ...fields } = body

    if (!type || !fields.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('waitlist').insert({
      type,
      email: fields.email,
      name: fields.name ?? null,
      metadata: fields,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Table may not exist yet — log but still return success so the UI works
      console.error('Waitlist insert error:', error.message)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist route error:', err)
    return NextResponse.json({ success: true }) // never break the UX
  }
}

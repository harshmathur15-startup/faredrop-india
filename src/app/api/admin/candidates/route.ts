import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-guard'

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('deal_candidates')
    .select('*')
    .in('status', ['pending', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidates: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const authErr = requireAdmin(req)
  if (authErr) return authErr

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('deal_candidates')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

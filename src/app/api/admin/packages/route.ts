import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminToken } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

// GET /api/admin/packages?status=pending — admin lists packages for review.
export async function GET(req: NextRequest) {
  if (!isAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('agent_packages')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('verification_status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ packages: data ?? [] })
}

// PATCH /api/admin/packages — verify/reject a package and/or toggle traveller
// visibility.
export async function PATCH(req: NextRequest) {
  if (!isAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    id?: string
    action?: 'verify' | 'reject'
    rejection_reason?: string
    visible_to_travellers?: boolean
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.action === 'verify') {
    patch.verification_status = 'verified'
    patch.published_at = new Date().toISOString()
    patch.rejection_reason = null
  } else if (body.action === 'reject') {
    patch.verification_status = 'rejected'
    patch.rejection_reason = body.rejection_reason ?? null
    patch.published_at = null
  }
  if (typeof body.visible_to_travellers === 'boolean') {
    patch.visible_to_travellers = body.visible_to_travellers
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('agent_packages')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ package: data })
}

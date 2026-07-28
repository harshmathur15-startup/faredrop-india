import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId } from '@/lib/auth-server'
import type { UserRole } from '@/types/marketplace'

export const dynamic = 'force-dynamic'

const ROLES: UserRole[] = ['traveller', 'agent', 'creator']

// GET /api/profile — the caller's own profile (role + marketplace fields).
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({ profile: data ?? { user_id: userId, role: 'traveller' } })
}

// PUT /api/profile — upsert own profile (set role, agency/creator fields).
export async function PUT(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() }
  if (typeof body.role === 'string' && ROLES.includes(body.role as UserRole)) patch.role = body.role
  for (const k of ['full_name', 'phone', 'agency_name', 'agency_city', 'instagram_handle']) {
    if (k in body) patch[k] = body[k]
  }
  if ('audience_size' in body) patch.audience_size = body.audience_size ? Number(body.audience_size) : null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

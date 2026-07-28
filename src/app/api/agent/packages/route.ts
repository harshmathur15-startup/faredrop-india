import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId, getRole } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

// GET /api/agent/packages — the agent's own packages (any status).
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('agent_packages')
    .select('*')
    .eq('agent_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ packages: data ?? [] })
}

// POST /api/agent/packages — create a package. Starts 'pending' (hidden until
// Travel Baby verifies it).
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((await getRole(userId)) !== 'agent') {
    return NextResponse.json({ error: 'Only agents can post packages' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.title || !body.destination) {
    return NextResponse.json({ error: 'Title and destination are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('agent_packages')
    .insert({
      agent_id: userId,
      title: body.title,
      destination: body.destination,
      description: body.description ?? null,
      price_per_person: body.price_per_person ? Number(body.price_per_person) : null,
      duration_days: body.duration_days ? Number(body.duration_days) : null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      inclusions: body.inclusions ?? null,
      image_url: body.image_url ?? null,
      // verification_status defaults to 'pending'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ package: data })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token')
  return token === process.env.ADMIN_SECRET
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const required = ['origin_iata', 'dest_iata', 'origin_city', 'dest_city', 'airline', 'normal_price', 'deal_price', 'validity_start', 'validity_end', 'source_url', 'image_url']

  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('deals').insert({
    ...body,
    currency: body.currency ?? 'INR',
    status: 'published',
    published_at: new Date().toISOString(),
    curator_note: body.curator_note ?? '',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deal: data })
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing deal id' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('deals').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deal: data })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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

// Resolve the user from a Bearer access token (sessions live in localStorage, not
// cookies), falling back to the cookie session for any server-rendered callers.
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

// GET /api/preferences
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preferences: data })
}

// POST /api/preferences — upsert
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['home_airport', 'home_airport_city', 'whatsapp_number',
                   'whatsapp_opted_in', 'email_opted_in', 'cabin_preference']
  const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preferences: data })
}

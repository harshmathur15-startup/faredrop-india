import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserId, getRole } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

// GET /api/creator/packages — verified packages creators can browse & promote.
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((await getRole(userId)) !== 'creator') {
    return NextResponse.json({ error: 'Creators only' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('agent_packages')
    .select('*')
    .eq('verification_status', 'verified')
    .order('published_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ packages: data ?? [] })
}

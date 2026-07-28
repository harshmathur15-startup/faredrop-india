import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/packages — public: verified packages the admin published to
// travellers. No auth required.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('agent_packages')
    .select('*')
    .eq('verification_status', 'verified')
    .eq('visible_to_travellers', true)
    .order('published_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ packages: data ?? [] })
}

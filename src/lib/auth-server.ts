import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'
import type { UserRole } from '@/types/marketplace'

// Resolve the auth user id from a Bearer access token (sessions live in
// localStorage, not cookies), falling back to the cookie session. Mirrors the
// pattern used in /api/preferences.
export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && data.user) return data.user.id
  }
  try {
    const jar = await cookies()
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => jar.getAll(), setAll: () => {} } },
    )
    const { data: { session } } = await client.auth.getSession()
    return session?.user.id ?? null
  } catch {
    return null
  }
}

// Look up a user's marketplace role. Defaults to 'traveller' when no profile row
// exists yet.
export async function getRole(userId: string): Promise<UserRole> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.role as UserRole | undefined) ?? 'traveller'
}

// Admin auth reuses the existing shared-secret header (same as /api/admin/*).
// FAILS CLOSED: denies when ADMIN_SECRET is unset or the header is missing, so a
// misconfigured deploy can never leave admin endpoints open. See src/lib/api-guard.ts.
export function isAdminToken(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const token = req.headers.get('x-admin-token')
  if (!token) return false
  return token === secret
}

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service-role Supabase client. SERVER-ONLY.
//
// It is built from SUPABASE_SERVICE_ROLE_KEY, which BYPASSES Row Level Security
// and therefore must never reach the browser. This module must only be imported
// from server code (API routes, server components, server-only lib files) — use
// ./supabase (anon key) on the client instead.
//
// The guard below fails loudly if this module is ever bundled into client code:
// in the browser `window` is defined, so any accidental client import throws at
// module-evaluation time instead of silently shipping a privileged code path.
// (Next.js already strips SUPABASE_SERVICE_ROLE_KEY from client bundles because
// it lacks the NEXT_PUBLIC_ prefix, so the key value never actually leaks — this
// guard prevents the code path from regressing in the first place.)
if (typeof window !== 'undefined') {
  throw new Error(
    '@/lib/supabase-admin was imported into client code. The service-role key ' +
      'must never reach the browser — use @/lib/supabase (anon) on the client.',
  )
}

let _admin: SupabaseClient | null = null

function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    _admin = createClient(url, key)
  }
  return _admin
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAdmin() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Anon-key client. SAFE to import from client OR server code — the anon key is
// public by design (it ships in the browser bundle) and is gated by Row Level
// Security. For privileged, RLS-bypassing access use ./supabase-admin (server
// only). Keeping the two clients in separate modules ensures the service-role
// key can never be pulled into a client bundle via this file.
function makeClient(url: string, key: string): SupabaseClient {
  return createClient(url, key)
}

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _client = makeClient(url, key)
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

'use client'

import { supabase } from './supabase'

// Build fetch headers with the Supabase access token as a Bearer (sessions live
// in localStorage, so the server can't read a cookie for these API routes).
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  return headers
}

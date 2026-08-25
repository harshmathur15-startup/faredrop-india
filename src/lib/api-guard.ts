import { NextRequest, NextResponse } from 'next/server'
import { adminTokenValid, cronSecretValid, rateLimit as coreRateLimit } from '@/lib/auth-core'

/**
 * Admin shared-secret check. FAILS CLOSED: if ADMIN_SECRET is not configured,
 * every request is denied (no hardcoded fallback password anywhere).
 */
export function isAdmin(req: NextRequest): boolean {
  return adminTokenValid(req.headers.get('x-admin-token'), process.env.ADMIN_SECRET)
}

/**
 * Returns a 401/403/503 response when the caller is not an admin, or null when
 * the request may proceed. Call this BEFORE any FlightAPI/Supabase work so an
 * unauthorized request never triggers third-party calls or DB reads/writes.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!process.env.ADMIN_SECRET) {
    // Misconfiguration must not silently open the endpoint.
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 503 })
  }
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Verifies the Vercel Cron / internal-job secret. FAILS CLOSED when CRON_SECRET
 * is unset. Accepts either `Authorization: Bearer <secret>` or `x-cron-secret`.
 */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Cron auth not configured' }, { status: 503 })
  }
  if (cronSecretValid(req.headers.get('authorization'), req.headers.get('x-cron-secret'), process.env.CRON_SECRET)) {
    return null
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Per-serverless-instance fixed-window limiter — enough to blunt abuse/runaway
// loops on expensive refresh/import endpoints. Not a shared limiter at scale.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  return coreRateLimit(key, limit, windowMs)
}

export function clientKey(req: NextRequest, scope: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  return `${scope}:${ip}`
}

export function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: 'Rate limit exceeded, try again shortly' }, { status: 429 })
}

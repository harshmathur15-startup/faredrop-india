// Framework-agnostic auth + rate-limit primitives (no next/server import) so
// they are unit-testable under `node --test`. api-guard.ts wraps these with
// NextRequest/NextResponse.
import { timingSafeEqual } from 'crypto'

// Constant-time compare that never throws on length mismatch.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

// FAILS CLOSED: false when the secret is unset OR the token is missing/wrong.
export function adminTokenValid(token: string | null | undefined, secret: string | undefined | null): boolean {
  if (!secret) return false
  if (!token) return false
  return safeEqual(token, secret)
}

// Accepts either an Authorization: Bearer <secret> value or an x-cron-secret
// header value. FAILS CLOSED when secret is unset.
export function cronSecretValid(
  authHeader: string | null | undefined,
  cronHeader: string | null | undefined,
  secret: string | undefined | null,
): boolean {
  if (!secret) return false
  const auth = authHeader ?? ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const header = cronHeader ?? ''
  return (!!bearer && safeEqual(bearer, secret)) || (!!header && safeEqual(header, secret))
}

// Simple in-memory fixed-window rate limiter (per-process). Returns true if the
// call is allowed, false when the window's limit is exhausted.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count += 1
  return true
}

// Test hook.
export function __resetRateLimits(): void {
  buckets.clear()
}

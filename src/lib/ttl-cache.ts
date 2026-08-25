// Tiny in-memory TTL cache for expensive server-side computations (e.g. the
// analytics summary). Per-serverless-instance; values are plain JSON-serialisable.
type Entry = { value: unknown; expiresAt: number }
const store = new Map<string, Entry>()

export function getCached<T>(key: string): T | null {
  const e = store.get(key)
  if (!e) return null
  if (Date.now() >= e.expiresAt) {
    store.delete(key)
    return null
  }
  return e.value as T
}

export function setCached(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

'use client'

import { authHeaders } from './api-client'

// Client-side analytics dispatcher. Sends events to /api/events with a keepalive
// fetch so in-flight requests survive route changes and tab close (sendBeacon
// can't attach the Supabase Bearer token, and our sessions live in localStorage).
// Everything here is fire-and-forget — a failed send is silently dropped.

export type TrackEvent = {
  type:
    | 'impression' | 'click' | 'page_view'
    | 'checkout_started' | 'payment_success' | 'checkout_abandoned' | 'checkout_failed'
  deal_id?: string
  surface?: string
  position?: number
  page?: string
  dwell_ms?: number
  tier?: string
  meta?: Record<string, unknown>
}

const ANON_KEY = 'tb_anon_id'

// Stable per-browser id so logged-out impressions/clicks can still be grouped
// (and later stitched to a user once they sign in).
export function anonId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(ANON_KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(ANON_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

export async function trackEvents(events: TrackEvent[]): Promise<void> {
  if (typeof window === 'undefined' || events.length === 0) return
  const anon = anonId()
  const payload = { events: events.map(e => ({ ...e, anon_id: anon })) }
  try {
    const headers = await authHeaders()
    await fetch('/api/events', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    /* analytics is best-effort; never disrupt the app */
  }
}

export function trackEvent(event: TrackEvent): Promise<void> {
  return trackEvents([event])
}

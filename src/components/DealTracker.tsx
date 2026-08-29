'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent, trackEvents, type TrackEvent } from '@/lib/track'

// Single, decoupled instrumentation point for the whole app. Deal components
// stay untouched beyond a few `data-*` attributes on their clickable anchor:
//   data-deal-id     (uuid, required for a node to be tracked)
//   data-surface     (hero | carousel | grid | spotlight | pricing)
//   data-position    (slot index within that surface)
//   data-locked      ("true" when the card links to /pricing instead of the deal)
//
// Responsibilities:
//   • impressions — one event the first time a deal card is ≥50% visible
//   • clicks      — event delegation on any anchor carrying data-deal-id
//   • page dwell  — time spent on each route (answers "which page holds them")

function parseNode(el: HTMLElement): TrackEvent | null {
  const dealId = el.getAttribute('data-deal-id')
  if (!dealId) return null
  const posAttr = el.getAttribute('data-position')
  const locked = el.getAttribute('data-locked') === 'true'
  return {
    type: 'impression',
    deal_id: dealId,
    surface: el.getAttribute('data-surface') ?? undefined,
    position: posAttr != null ? Number(posAttr) : undefined,
    meta: locked ? { locked: true } : undefined,
  }
}

function DealTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ---- impressions + clicks (mounted once) --------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return

    const seen = new Set<string>()          // dedupe impressions per page load
    const queue: TrackEvent[] = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flush = () => {
      flushTimer = null
      if (queue.length === 0) return
      const batch = queue.splice(0, queue.length)
      void trackEvents(batch)
    }
    const enqueue = (ev: TrackEvent) => {
      queue.push(ev)
      if (queue.length >= 20) { flush(); return }
      if (!flushTimer) flushTimer = setTimeout(flush, 3000)
    }

    // Impressions: fire once when a card first becomes half-visible.
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        const ev = parseNode(el)
        if (!ev) continue
        const key = `${ev.deal_id}|${ev.surface ?? ''}`
        if (seen.has(key)) { io.unobserve(el); continue }
        seen.add(key)
        enqueue(ev)
        io.unobserve(el)
      }
    }, { threshold: 0.5 })

    const observeAll = (root: ParentNode) =>
      root.querySelectorAll<HTMLElement>('[data-deal-id]').forEach(el => io.observe(el))
    observeAll(document)

    // Cards mount/unmount as carousels filter — pick up new nodes as they appear.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches('[data-deal-id]')) io.observe(node)
          observeAll(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Clicks: delegate so we never touch individual card components.
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest<HTMLElement>('[data-deal-id]')
      if (!anchor) return
      const base = parseNode(anchor)
      if (!base) return
      // Navigation is imminent — send immediately (keepalive) rather than queue.
      void trackEvent({ ...base, type: 'click' })
    }
    document.addEventListener('click', onClick, { capture: true })

    // Don't lose queued impressions when the tab is hidden or closed.
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)

    return () => {
      flush()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  // ---- page dwell: emit time spent on the previous route -------------------
  // Initialised to 0 (not Date.now()) so nothing impure runs during render;
  // the effect below stamps the real entry time on mount and every route change.
  const enteredAt = useRef<number>(0)
  const lastPath = useRef<string>('')

  useEffect(() => {
    const query = searchParams.toString()
    const url = pathname + (query ? `?${query}` : '')

    const emit = () => {
      const prev = lastPath.current
      if (!prev) return
      const dwell = Date.now() - enteredAt.current
      if (dwell < 500) return // ignore instant bounces / double renders
      void trackEvent({ type: 'page_view', page: prev, dwell_ms: dwell })
    }

    // Route changed → log dwell for the page we're leaving, then reset.
    emit()
    lastPath.current = url
    enteredAt.current = Date.now()

    // Also flush dwell for the current page when the tab closes.
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return
      const dwell = Date.now() - enteredAt.current
      if (dwell < 500) return
      void trackEvent({ type: 'page_view', page: url, dwell_ms: dwell })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [pathname, searchParams])

  return null
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function DealTracker() {
  return (
    <Suspense fallback={null}>
      <DealTrackerInner />
    </Suspense>
  )
}

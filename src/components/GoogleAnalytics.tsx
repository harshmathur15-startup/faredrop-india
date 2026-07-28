'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// Sends a GA4 page_view on client-side route changes. The first page_view is
// sent by gtag('config', …), so we skip the initial mount to avoid double count.
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (typeof window.gtag !== 'function') return
    const query = searchParams.toString()
    const url = pathname + (query ? `?${query}` : '')
    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
    })
  }, [pathname, searchParams])

  return null
}

// GA4 via gtag.js. Dormant until NEXT_PUBLIC_GA_ID (a "G-XXXXXXXXXX" Measurement
// ID) is set — renders nothing without it, so it's safe to ship before the ID
// exists.
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}

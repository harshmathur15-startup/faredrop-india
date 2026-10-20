import type { MetadataRoute } from 'next'
import { getAllRoutes } from '@/lib/routes'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'

// Rebuilt at most once an hour so new routes surface promptly.
export const revalidate = 3600

// Serves /sitemap.xml — static marketing pages plus the programmatic route
// pages (/flights/[route]).
//
// Individual /deal/[id] pages are deliberately EXCLUDED. Deals expire within
// ~2-3 weeks (measured: 86% of deals >20 days old are no longer live), so
// deal URLs churn constantly — ~70% of what we previously listed was already
// gone by the time Google got around to crawling it. Submitting URLs that
// are routinely dead by the time they're indexed trains Google to crawl the
// whole domain more cautiously. /flights/[route] pages cover the same
// destinations but are durable (a route stays live as its deals rotate), so
// crawl budget is better spent there. Expired /deal/[id] URLs 308-redirect
// to their /flights/[route] page (see deal/[id]/page.tsx) rather than 404,
// so any inbound links/crawl equity still land somewhere indexable.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/for-creators`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/for-agents`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/request-deal`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Programmatic route landing pages (/flights/[route]) — the SEO entry points.
  let flightRoutes: MetadataRoute.Sitemap = []
  try {
    const routes = await getAllRoutes()
    flightRoutes = routes.map(
      (r): MetadataRoute.Sitemap[number] => ({
        url: `${SITE_URL}/flights/${r.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      }),
    )
  } catch {
    // Still emit static routes if the route query fails.
  }

  return [...staticRoutes, ...flightRoutes]
}

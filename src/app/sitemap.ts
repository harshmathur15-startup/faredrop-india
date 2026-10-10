import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getAllRoutes } from '@/lib/routes'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'

// Rebuilt at most once an hour so newly published deals get indexed.
export const revalidate = 3600

// Serves /sitemap.xml — static marketing pages plus every published deal page,
// so Google can discover and index the full catalogue.
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

  let dealRoutes: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabase
      .from('deals')
      .select('id, last_verified_at')
      .eq('status', 'published')
    dealRoutes = (data ?? []).map(
      (d: { id: string; last_verified_at: string | null }): MetadataRoute.Sitemap[number] => ({
        url: `${SITE_URL}/deal/${d.id}`,
        lastModified: d.last_verified_at ? new Date(d.last_verified_at) : now,
        changeFrequency: 'daily',
        priority: 0.8,
      }),
    )
  } catch {
    // If the DB is unreachable at build time, still emit the static routes.
  }

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
    // Still emit everything else if the route query fails.
  }

  return [...staticRoutes, ...flightRoutes, ...dealRoutes]
}

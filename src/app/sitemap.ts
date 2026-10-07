import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'

export const revalidate = 3600

// Serves /sitemap.xml — STABLE pages only. Individual /deal/[id] pages are
// ephemeral (deals are created and expire daily) and carry `noindex`, so listing
// them here would just flood the index with URLs that die within days. The
// homepage is the durable, always-fresh anchor that Google indexes; add stable
// route/destination landing pages here when they're built.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/for-creators`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/for-agents`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/request-deal`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}

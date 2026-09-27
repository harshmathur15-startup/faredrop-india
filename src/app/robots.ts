import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'

// Serves /robots.txt — allow crawling of public pages, keep admin/api out,
// and point crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

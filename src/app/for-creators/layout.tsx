import type { Metadata } from 'next'

// The page itself is a Client Component and can't export metadata, so this
// server-side segment layout supplies the title + self-canonical for SEO.
export const metadata: Metadata = {
  title: 'For Travel Creators — Earn on the trips you inspire',
  description: 'Share curated flight deals with your audience and earn commission on every confirmed booking. Join the Travelbaby creator waitlist.',
  alternates: { canonical: '/for-creators' },
}

export default function ForCreatorsLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'

// The page itself is a Client Component and can't export metadata, so this
// server-side segment layout supplies the title + self-canonical for SEO.
export const metadata: Metadata = {
  title: 'For Travel Agents — High-intent traveller leads',
  description: 'Reach travellers who are ready to book. Run campaigns through trusted creators and pay only on confirmed bookings with Travelbaby.',
  alternates: { canonical: '/for-agents' },
}

export default function ForAgentsLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'

// The page itself is a Client Component and can't export metadata, so this
// server-side segment layout supplies the title + self-canonical for SEO.
export const metadata: Metadata = {
  title: 'Request a Deal — Tell us where you want to fly',
  description: 'Can\'t find your route? Tell Travelbaby your destination, dates and budget and we\'ll hunt the fare for you.',
  alternates: { canonical: '/request-deal' },
}

export default function RequestDealLayout({ children }: { children: React.ReactNode }) {
  return children
}

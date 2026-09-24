import Link from 'next/link'
import Image from 'next/image'
import PricingCards from '@/components/PricingCards'

export const metadata = { title: 'Pricing — Travelbaby' }

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-full transition-colors shrink-0">
          <span aria-hidden="true">←</span> Home
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-3">Choose your membership</h1>
          <p className="text-gray-500 text-lg">Start free. Upgrade anytime. Cancel anytime.</p>
        </div>

        <PricingCards />
      </div>
    </main>
  )
}

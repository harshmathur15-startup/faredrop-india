import Link from 'next/link'
import Image from 'next/image'
import PricingCards from '@/components/PricingCards'

export const metadata = { title: 'Pricing — Travelbaby' }

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Beta
          </span>
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-3">Choose your membership</h1>
          <p className="text-gray-500 text-lg">Start free. Upgrade anytime. Cancel anytime.</p>
        </div>

        {/* Beta notice — online payments not live yet, plans unlock deals free for now */}
        <div className="max-w-2xl mx-auto mb-10 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-amber-900 font-semibold text-sm">
            🎉 We&apos;re in beta — online payments are coming soon.
          </p>
          <p className="text-amber-800 text-sm mt-1">
            For now, choose <span className="font-bold">Silver</span> or <span className="font-bold">Gold</span> to unlock all deals free.
          </p>
        </div>

        <PricingCards />

        <p className="text-center text-gray-400 text-sm mt-10">
          All plans include human-verified deals · No booking fees · Cancel anytime
        </p>
      </div>
    </main>
  )
}

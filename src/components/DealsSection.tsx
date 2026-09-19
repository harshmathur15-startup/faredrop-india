'use client'

import Link from 'next/link'
import { Deal } from '@/types'
import { calcDiscount } from '@/lib/utils'
import { useUserTier } from '@/lib/useAuth'
import DestinationGrid from './DestinationGrid'

function SectionHeader({ deals }: { deals: Deal[] }) {
  const liveCount = deals.filter(d => calcDiscount(d.normal_price, d.deal_price) > 0).length
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Live deals</h2>
        <p className="text-gray-500 mt-1">
          {deals.length > 0
            ? `${liveCount} handpicked deals live now`
            : 'Our falcon is hunting right now'}
        </p>
      </div>
      {deals.length > 0 && (
        <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
          ✈ Round-trip &amp; one-way fares
        </span>
      )}
    </div>
  )
}

export default function DealsSection({ deals }: { deals: Deal[] }) {
  const { authed, tier } = useUserTier()

  // Loading
  if (authed === undefined || (authed && tier === undefined)) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <div className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse" />
      </section>
    )
  }

  // Signed out — full lock wall
  if (!authed) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <SectionHeader deals={deals} />
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-blue-100 shadow-sm">
          <p className="text-5xl mb-4">🔒</p>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Members-only access</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Sign up free to unlock curated flight deals — up to 90% off for Indian travellers
          </p>
          <Link href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Sign up free →
          </Link>
          <p className="text-gray-400 text-xs mt-4">No credit card · Takes 30 seconds</p>
        </div>
      </section>
    )
  }

  const isPremiumUser = tier === 'silver' || tier === 'gold'
  const sortedDeals = [...deals].sort((a, b) =>
    calcDiscount(b.normal_price, b.deal_price) - calcDiscount(a.normal_price, a.deal_price)
  )

  // Both free & paid see the same filterable storefront (city / class / month).
  // For free users, premium deals stay locked — shown as teasers but their exact
  // dates & booking links are hidden and clicks route to /pricing.
  const lockedIds = isPremiumUser ? undefined : new Set(sortedDeals.filter(d => d.is_premium).map(d => d.id))
  const lockedCount = lockedIds?.size ?? 0

  return (
    <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
      <SectionHeader deals={deals} />
      <DestinationGrid deals={sortedDeals} lockedIds={lockedIds} />
      {lockedCount > 0 && (
        <div className="mt-10 text-center py-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
          <p className="text-lg font-bold text-gray-900 mb-1">🔒 {lockedCount} members-only deal{lockedCount > 1 ? 's' : ''} — dates &amp; booking links hidden</p>
          <p className="text-gray-500 text-sm mb-5">Unlock every deal + real-time alerts. Cancel anytime.</p>
          <Link href="/pricing" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3 rounded-xl transition-colors">
            Try Silver for ₹1 →
          </Link>
        </div>
      )}
    </section>
  )
}

'use client'

import Link from 'next/link'
import { Deal } from '@/types'
import { calcDiscount } from '@/lib/utils'
import { useUserTier } from '@/lib/useAuth'
import DealCard from './DealCard'
import DealCarousel from './DealCarousel'

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
          ✈ All prices are return (round-trip) fares
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

  // Premium user — see everything
  if (isPremiumUser) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <SectionHeader deals={deals} />
        <DealCarousel deals={sortedDeals} />
      </section>
    )
  }

  // Free user — see free deals fully, premium deals locked
  const freeDeals    = sortedDeals.filter(d => !d.is_premium)
  const premiumDeals = sortedDeals.filter(d =>  d.is_premium)

  return (
    <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
      <SectionHeader deals={deals} />

      {/* Free deals — full access */}
      {freeDeals.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          No free deals right now — check back soon or upgrade to see all deals.
        </div>
      ) : (
        <DealCarousel deals={freeDeals} />
      )}

      {/* Premium deals — locked, grouped by cabin */}
      {premiumDeals.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">👑 Members-only deals</h3>
              <p className="text-gray-500 text-sm mt-0.5">{premiumDeals.length} exclusive deals · dates &amp; booking links hidden</p>
            </div>
            <Link href="/pricing" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shrink-0">
              Unlock all →
            </Link>
          </div>

          {/* Cabin sub-sections */}
          <div className="space-y-10">
            {([
              { key: 'Economy',         label: 'Economy',         icon: '✈',  hdr: 'text-blue-700',   cnt: 'bg-blue-100 text-blue-700 border-blue-200' },
              { key: 'Premium Economy', label: 'Premium Economy', icon: '⭐', hdr: 'text-violet-700', cnt: 'bg-violet-100 text-violet-700 border-violet-200' },
              { key: 'Business',        label: 'Business Class',  icon: '👑', hdr: 'text-amber-700',  cnt: 'bg-amber-100 text-amber-800 border-amber-200' },
            ] as const).map(sec => {
              const sDeals = premiumDeals.filter(d => {
                const n = (d.curator_note || '').toLowerCase()
                if (sec.key === 'Business')        return n.startsWith('business') || n.includes('business ·')
                if (sec.key === 'Premium Economy') return n.startsWith('premium economy') || n.includes('premium economy')
                return !n.startsWith('business') && !n.includes('business ·') && !n.startsWith('premium economy') && !n.includes('premium economy')
              })
              if (sDeals.length === 0) return null
              return (
                <div key={sec.key}>
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className={`font-display text-lg font-bold ${sec.hdr}`}>{sec.icon} {sec.label}</h4>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sec.cnt}`}>{sDeals.length} deal{sDeals.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sDeals.map(deal => <DealCard key={deal.id} deal={deal} locked />)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center py-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            <p className="text-lg font-bold text-gray-900 mb-1">Upgrade to unlock {premiumDeals.length} more deal{premiumDeals.length > 1 ? 's' : ''}</p>
            <p className="text-gray-500 text-sm mb-5">Cancel anytime</p>
            <Link href="/pricing" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3 rounded-xl transition-colors">
              Try Silver for ₹1 →
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

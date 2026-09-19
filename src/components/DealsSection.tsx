'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Deal } from '@/types'
import { calcDiscount } from '@/lib/utils'
import { useUserTier, useUnlocks } from '@/lib/useAuth'
import { pickStorefront } from '@/lib/storefront'
import DestinationGrid from './DestinationGrid'

const STOREFRONT_LIMIT = 50 // deals shown to anonymous + free (signed-up) users

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
  const { state, unlock } = useUnlocks()
  const router = useRouter()

  // Loading auth/tier
  if (authed === undefined || (authed && tier === undefined)) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <div className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse" />
      </section>
    )
  }

  const isPaid = authed === true && (tier === 'silver' || tier === 'gold')

  // Paid — full catalogue, nothing locked.
  if (isPaid) {
    const sorted = [...deals].sort((a, b) =>
      calcDiscount(b.normal_price, b.deal_price) - calcDiscount(a.normal_price, a.deal_price))
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <SectionHeader deals={deals} />
        <DestinationGrid deals={sorted} />
      </section>
    )
  }

  // Anonymous + free both see the same 50-deal storefront (spread across destinations).
  const storefront = pickStorefront(deals, STOREFRONT_LIMIT)

  // Signed out — everything locked, taps route to sign-up.
  if (!authed) {
    const lockedIds = new Set(storefront.map(d => d.id))
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <SectionHeader deals={deals} />
        <div className="mb-6 text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <p className="text-lg font-bold text-slate-900 mb-1">🔒 {storefront.length} deals inside — sign up free to unlock</p>
          <p className="text-gray-500 text-sm mb-4">Every member gets <strong>3 free unlocks a month</strong>. No credit card.</p>
          <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Sign up free →
          </Link>
        </div>
        <DestinationGrid deals={storefront} lockedIds={lockedIds} lockHref="/signup" />
      </section>
    )
  }

  // Signed-up free user — same 50, locked except deals they've unlocked. Unlock spends a credit.
  const unlocked = state?.unlocked ?? new Set<string>()
  const credits = state?.credits ?? 0
  const lockedIds = new Set(storefront.filter(d => !unlocked.has(d.id)).map(d => d.id))

  const handleUnlock = async (dealId: string) => {
    if (credits <= 0) { router.push('/pricing'); return }
    const res = await unlock(dealId)
    if (!res.ok && res.reason === 'no_credits') router.push('/pricing')
    // On success, useUnlocks updates state → this component re-renders and the deal unlocks.
  }

  return (
    <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
      <SectionHeader deals={deals} />
      <DestinationGrid deals={storefront} lockedIds={lockedIds} onUnlock={handleUnlock} credits={credits} lockHref="/pricing" />
    </section>
  )
}

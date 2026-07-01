'use client'

import Link from 'next/link'
import { Deal } from '@/types'
import { calcDiscount } from '@/lib/utils'
import { useAuthed } from '@/lib/useAuth'
import DealCarousel from './DealCarousel'

export default function DealsSection({ deals }: { deals: Deal[] }) {
  const authed = useAuthed()

  // still checking auth — show skeleton to avoid layout shift
  if (authed === undefined) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <div className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse" />
      </section>
    )
  }

  // signed out — lock the carousel
  if (!authed) {
    return (
      <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Live deals</h2>
            <p className="text-gray-500 mt-1">
              {deals.length > 0
                ? `${deals.filter(d => calcDiscount(d.normal_price, d.deal_price) > 0).length} handpicked deals live now`
                : 'Our falcon is hunting right now'}
            </p>
          </div>
          {deals.length > 0 && (
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
              ✈ All prices are return (round-trip) fares
            </span>
          )}
        </div>
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-blue-100 shadow-sm">
          <p className="text-5xl mb-4">🔒</p>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Members-only access</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Sign up free to unlock all live curated flight deals — up to 90% off for Indian travellers
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

  // signed in — show full carousel
  return (
    <section id="deals" className="max-w-6xl mx-auto px-5 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            {deals.length > 0 ? 'Live deals' : 'Deals dropping soon'}
          </h2>
          <p className="text-gray-500 mt-1">
            {deals.length > 0
              ? `${deals.filter(d => calcDiscount(d.normal_price, d.deal_price) > 0).length} handpicked deals live now`
              : 'Our falcon is hunting right now'}
          </p>
        </div>
        {deals.length > 0 && (
          <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            ✈ All prices are return (round-trip) fares
          </span>
        )}
      </div>
      <DealCarousel
        deals={[...deals].sort((a, b) =>
          calcDiscount(b.normal_price, b.deal_price) - calcDiscount(a.normal_price, a.deal_price)
        )}
      />
    </section>
  )
}

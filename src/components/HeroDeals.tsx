'use client'

import { Deal } from '@/types'
import DealLink from './DealLink'
import { calcDiscount, formatPrice, tripFromNote } from '@/lib/utils'
import { flagFor } from '@/lib/flags'
import { pickHeroDeals } from '@/lib/heroDeals'

export default function HeroDeals({ deals }: { deals: Deal[] }) {
  // Featured strip = top 5 free deals (one row); the rest show in the deals grid.
  const heroDeals = pickHeroDeals(deals, 5).map(d => ({ ...d, discount: calcDiscount(d.normal_price, d.deal_price) }))

  if (heroDeals.length === 0) return null

  return (
    <>
      <div className="mb-4 mt-12 flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        <p className="text-white text-xs font-bold uppercase tracking-widest">
          Live curated deals · sign up to book
        </p>
      </div>
      <div className="flex gap-3 mb-0 max-w-5xl mx-auto overflow-x-auto snap-x snap-mandatory pb-2 px-1 sm:flex-nowrap sm:justify-center sm:overflow-visible sm:pb-0">
        {heroDeals.map((deal, i) => {
          const note = (deal.curator_note ?? '').toLowerCase()
          const isBusiness = note.includes('business')
          const isPEDeal = note.includes('premium economy') || note.includes('premium_economy')
          const oneWay = tripFromNote(deal.curator_note) === 'oneway'
          const tierColor = deal.discount >= 70 ? 'bg-violet-600' : deal.discount >= 50 ? 'bg-emerald-600' : 'bg-blue-600'
          return (
            <DealLink key={deal.id} dealId={deal.id} surface="hero" position={i}
              className="group relative rounded-2xl p-4 text-left overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 block snap-start shrink-0 w-[160px] sm:flex-1 sm:w-auto sm:min-w-0 sm:max-w-[190px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl leading-none">{flagFor(deal.dest_iata)}</span>
                <span className={`${tierColor} text-white text-[11px] font-semibold px-2 py-0.5 rounded-full`}>{deal.discount}% off</span>
              </div>
              <p className="font-display font-bold text-lg leading-tight text-slate-900">{deal.dest_city}</p>
              {/* Trip type — explicit so round-trip vs one-way is unmistakable */}
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${oneWay ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                  {oneWay ? '→ One way' : '⇄ Round trip'}
                </span>
                {(isBusiness || isPEDeal) && (
                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={isBusiness ? { backgroundColor: '#fef3c7', color: '#92400e' } : { backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                    {isBusiness ? '✦ Business' : '⬆ Prem. Eco'}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] mt-1 mb-2 truncate">{oneWay ? `${deal.origin_iata}–${deal.dest_iata}` : `${deal.origin_iata}–${deal.dest_iata}–${deal.origin_iata}`}</p>
              <p className="text-slate-400 text-xs line-through leading-none">{formatPrice(deal.normal_price, deal.currency)}</p>
              <p className="font-display font-bold text-xl text-slate-900 leading-tight">{formatPrice(deal.deal_price, deal.currency)}</p>
              <p className="text-blue-600 text-xs mt-2 font-semibold group-hover:translate-x-0.5 transition-transform">View deal →</p>
            </DealLink>
          )
        })}
      </div>
    </>
  )
}

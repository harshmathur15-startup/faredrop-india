'use client'

import { Deal } from '@/types'
import DealLink from './DealLink'
import { calcDiscount, formatPrice } from '@/lib/utils'

const DEST_META: Record<string, { flag: string }> = {
  BKK: { flag: '🇹🇭' }, DMK: { flag: '🇹🇭' }, DPS: { flag: '🇮🇩' },
  SIN: { flag: '🇸🇬' }, DXB: { flag: '🇦🇪' }, AUH: { flag: '🇦🇪' },
  LHR: { flag: '🇬🇧' }, NRT: { flag: '🇯🇵' }, HND: { flag: '🇯🇵' },
  CDG: { flag: '🇫🇷' }, MLE: { flag: '🇲🇻' }, KUL: { flag: '🇲🇾' },
  HKT: { flag: '🇹🇭' }, HAN: { flag: '🇻🇳' }, SGN: { flag: '🇻🇳' },
  ICN: { flag: '🇰🇷' }, DOH: { flag: '🇶🇦' }, CMB: { flag: '🇱🇰' },
  SXR: { flag: '🇮🇳' }, PVG: { flag: '🇨🇳' }, SHA: { flag: '🇨🇳' },
}

export default function HeroDeals({ deals }: { deals: Deal[] }) {
  const scored = deals
    .map(d => ({ ...d, discount: calcDiscount(d.normal_price, d.deal_price) }))
    .filter(d => d.discount > 0 && !d.is_premium)
    .sort((a, b) => b.discount - a.discount)

  // One card per destination — keep the highest-discount deal for each
  const seen = new Set<string>()
  const heroDeals = scored.filter(d => {
    if (seen.has(d.dest_iata)) return false
    seen.add(d.dest_iata)
    return true
  })

  if (heroDeals.length === 0) return null

  return (
    <>
      <div className="mb-4 mt-12 flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        <p className="text-white text-xs font-bold uppercase tracking-widest">
          Live curated deals · return fares · sign up to book
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mb-0 max-w-3xl mx-auto">
        {heroDeals.map(deal => {
          const meta = DEST_META[deal.dest_iata] ?? { flag: '✈️' }
          const note = (deal.curator_note ?? '').toLowerCase()
          const isBusiness = note.includes('business')
          const isPEDeal = note.includes('premium economy') || note.includes('premium_economy')
          const tierColor = deal.discount >= 70 ? 'bg-violet-600' : deal.discount >= 50 ? 'bg-emerald-600' : 'bg-blue-600'
          return (
            <DealLink key={deal.id} dealId={deal.id}
              className="group relative rounded-2xl p-4 text-left overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 block flex-1 min-w-[155px] max-w-[190px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl leading-none">{meta.flag}</span>
                <span className={`${tierColor} text-white text-[11px] font-semibold px-2 py-0.5 rounded-full`}>{deal.discount}% off</span>
              </div>
              <p className="font-display font-bold text-lg leading-tight text-slate-900">{deal.dest_city}</p>
              {(isBusiness || isPEDeal) && (
                <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={isBusiness ? { backgroundColor: '#fef3c7', color: '#92400e' } : { backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                  {isBusiness ? '✦ Business' : '⬆ Prem. Eco'}
                </span>
              )}
              <p className="text-slate-500 text-[11px] mb-2 truncate">{deal.origin_iata}–{deal.dest_iata}–{deal.origin_iata}</p>
              <p className="text-slate-400 text-xs line-through leading-none">{formatPrice(deal.normal_price, deal.currency)}</p>
              <p className="font-display font-bold text-xl text-slate-900 leading-tight">
                {formatPrice(deal.deal_price, deal.currency)}{' '}
                <span className="text-slate-400 text-[11px] font-medium">return</span>
              </p>
              <p className="text-blue-600 text-xs mt-2 font-semibold group-hover:translate-x-0.5 transition-transform">View deal →</p>
            </DealLink>
          )
        })}
      </div>
    </>
  )
}

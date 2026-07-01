'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Deal } from '@/types'
import { formatPrice, calcDiscount } from '@/lib/utils'
import DealLink from '@/components/DealLink'

// Curated Unsplash photos per destination (no API key needed)
const CITY_IMAGES: Record<string, string> = {
  // SE Asia
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  DMK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  CMB: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&h=600&fit=crop',
  DPS: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  SIN: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&h=600&fit=crop',
  KUL: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  HKT: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop',
  HAN: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&h=600&fit=crop',
  SGN: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop',
  RGN: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop',
  // East Asia
  NRT: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  HND: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  ICN: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop',
  HKG: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=800&h=600&fit=crop',
  PEK: 'https://images.unsplash.com/photo-1508804052814-cd3ba865a116?w=800&h=600&fit=crop',
  PVG: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
  SHA: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
  // Middle East
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  AUH: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
  DOH: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
  // Indian Ocean
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
  SEZ: 'https://images.unsplash.com/photo-1505881402582-c5bc11054f91?w=800&h=600&fit=crop',
  // Europe
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  AMS: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  FCO: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
  BCN: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
  ZRH: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop',
  // Americas
  JFK: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  LAX: 'https://images.unsplash.com/photo-1580655653885-65763b2597d1?w=800&h=600&fit=crop',
  // Africa
  NBO: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=600&fit=crop',
  // Australia
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  MEL: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&h=600&fit=crop',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop'

function getDealImage(deal: Deal): string {
  const url = deal.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[deal.dest_iata] ?? FALLBACK_IMAGE
}

function getCabinClass(note: string): 'business' | 'premium_economy' | null {
  if (!note) return null
  const n = note.toLowerCase()
  if (n.includes('business')) return 'business'
  if (n.includes('premium economy') || n.includes('premium_economy')) return 'premium_economy'
  return null
}

function DealCard({ deal }: { deal: Deal }) {
  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const tierColor = discount >= 70 ? 'bg-violet-600' : discount >= 50 ? 'bg-emerald-600' : 'bg-blue-600'
  const cabin = getCabinClass(deal.curator_note)

  return (
    <DealLink
      dealId={deal.id}
      className="group flex flex-col w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image src={getDealImage(deal)} alt={deal.dest_city} fill sizes="(max-width:640px) 100vw, 240px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/5" />

        {/* Discount badge */}
        <div className={`absolute top-2.5 left-2.5 ${tierColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
          {discount}% off
        </div>

        {/* Cabin class badge — top right */}
        {cabin === 'business' && (
          <div className="absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: '#f59e0b', color: '#78350f' }}>
            ✦ Business
          </div>
        )}
        {cabin === 'premium_economy' && (
          <div className="absolute top-2.5 right-2.5 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: '#7c3aed' }}>
            ⬆ Prem. Economy
          </div>
        )}

        {/* Round-trip route on image */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="text-white/75 text-[11px] font-semibold tracking-wider uppercase">{deal.origin_iata} · {deal.dest_iata} · {deal.origin_iata} · Return</p>
          <p className="font-display text-white text-lg font-bold leading-tight">{deal.dest_city}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-medium text-slate-500 mb-2">{deal.airline}</p>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-slate-900">{formatPrice(deal.deal_price, deal.currency)}</span>
          <span className="text-sm text-slate-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
        </div>
        <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Return fare · round trip</p>

        <p className="text-xs text-slate-400 mt-2">
          {new Date(deal.validity_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(deal.validity_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        <div className="mt-auto pt-3 flex items-center text-blue-600 text-sm font-semibold">
          View deal
          <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </DealLink>
  )
}

// Indian airports — a deal whose destination is one of these is "Domestic"
const INDIAN_AIRPORTS = new Set([
  'DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'GOI', 'GOX', 'COK', 'AMD', 'PNQ', 'JAI',
  'SXR', 'IXC', 'LKO', 'GAU', 'PAT', 'TRV', 'IXB', 'IXZ', 'IXL', 'UDR', 'JDH', 'ATQ',
  'BBI', 'VNS', 'NAG', 'IDR', 'RPR', 'VTZ', 'CJB', 'IXM', 'IXE', 'IXJ', 'DED', 'BDQ',
])

function isDomestic(deal: Deal): boolean {
  return INDIAN_AIRPORTS.has(deal.dest_iata)
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function cabinLabel(deal: Deal): string {
  const c = getCabinClass(deal.curator_note)
  return c === 'business' ? 'Business' : c === 'premium_economy' ? 'Premium Economy' : 'Economy'
}
const CLASS_ORDER = ['Economy', 'Premium Economy', 'Business', 'First']

function FilterSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

export default function DealCarousel({ deals }: { deals: Deal[] }) {
  const [scope, setScope] = useState<'International' | 'Domestic'>('International')
  const [city, setCity] = useState('All cities')
  const [month, setMonth] = useState('All months')
  const [cls, setCls] = useState('All classes')

  function reset() { setCity('All cities'); setMonth('All months'); setCls('All classes') }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <Image src="/travel-baby-logo.png" alt="Travelbaby" width={80} height={80} className="h-20 w-auto drop-shadow mx-auto mb-3" />
        <p className="text-gray-700 font-semibold text-lg">Our falcon is hunting for deals!</p>
        <p className="text-gray-400 text-sm mt-1">New deals drop every week. Sign up above to be first.</p>
      </div>
    )
  }

  const scopeDeals = deals.filter(d => scope === 'Domestic' ? isDomestic(d) : !isDomestic(d))

  // Filter options derived from the current scope so there are never dead options
  const cityOptions = ['All cities', ...Array.from(new Set(scopeDeals.map(d => d.origin_city))).sort()]
  const monthOptions = ['All months', ...Array.from(new Set(scopeDeals.map(d => monthLabel(d.validity_start))))
    .sort((a, b) => new Date('1 ' + a).getTime() - new Date('1 ' + b).getTime())]
  const classOptions = ['All classes', ...CLASS_ORDER.filter(c => scopeDeals.some(d => cabinLabel(d) === c))]

  const filtered = scopeDeals.filter(d =>
    (city === 'All cities' || d.origin_city === city) &&
    (month === 'All months' || monthLabel(d.validity_start) === month) &&
    (cls === 'All classes' || cabinLabel(d) === cls)
  )
  const filtersActive = city !== 'All cities' || month !== 'All months' || cls !== 'All classes'

  return (
    <div>
      {/* International / Domestic tabs — International open by default */}
      <div className="inline-flex p-1 mb-6 bg-slate-100 rounded-full">
        {(['International', 'Domestic'] as const).map(s => (
          <button key={s} onClick={() => { setScope(s); reset() }}
            className={`text-sm font-bold px-6 py-2.5 rounded-full transition-colors ${
              scope === s ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {s === 'International' ? '✈ International' : '🏠 Domestic'}
          </button>
        ))}
      </div>

      {scopeDeals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-3xl mb-2">🪔</p>
          <p className="text-gray-700 font-semibold text-lg">Domestic festival deals dropping soon</p>
          <p className="text-gray-400 text-sm mt-1">Curated getaways around Diwali, Dussehra &amp; school holidays. Sign up to be first.</p>
        </div>
      ) : (
        <>
          {/* Quick filters */}
          <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <FilterSelect label="Home city" options={cityOptions} value={city} onChange={setCity} />
            <FilterSelect label="Month" options={monthOptions} value={month} onChange={setMonth} />
            <FilterSelect label="Class" options={classOptions} value={cls} onChange={setCls} />
            {filtersActive && (
              <div className="flex items-center gap-3 text-sm pb-2">
                <span className="text-slate-500">{filtered.length} deal{filtered.length === 1 ? '' : 's'}</span>
                <button onClick={reset} className="text-blue-600 font-semibold hover:underline">Reset</button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-700 font-semibold text-lg">No deals match these filters</p>
              <p className="text-gray-400 text-sm mt-1">Try a different month, class or home city — or reset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

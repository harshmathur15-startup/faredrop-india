'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Deal } from '@/types'
import { formatPrice, calcDiscount, tripFromNote, cabinFromNote } from '@/lib/utils'

const FLAG: Record<string, string> = {
  BKK: '🇹🇭', DMK: '🇹🇭', HKT: '🇹🇭', DPS: '🇮🇩', CGK: '🇮🇩', SIN: '🇸🇬',
  DXB: '🇦🇪', AUH: '🇦🇪', DOH: '🇶🇦', LHR: '🇬🇧', CDG: '🇫🇷', AMS: '🇳🇱',
  FCO: '🇮🇹', VIE: '🇦🇹', GVA: '🇨🇭', ZRH: '🇨🇭', MUC: '🇩🇪', TBS: '🇬🇪',
  IST: '🇹🇷', CAI: '🇪🇬', NRT: '🇯🇵', HND: '🇯🇵', ICN: '🇰🇷', HKG: '🇭🇰',
  PVG: '🇨🇳', PEK: '🇨🇳', HAN: '🇻🇳', SGN: '🇻🇳', KUL: '🇲🇾', CMB: '🇱🇰',
  MLE: '🇲🇻', GAN: '🇲🇻', MEL: '🇦🇺', SYD: '🇦🇺', YYZ: '🇨🇦', JFK: '🇺🇸',
  GOI: '🇮🇳', GOX: '🇮🇳', IXL: '🇮🇳', COK: '🇮🇳', UDR: '🇮🇳', SXR: '🇮🇳',
}
const mon = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { month: 'short' })
const cabinKey = (note?: string | null) => cabinFromNote(note) ?? 'Economy'

function CabinBadge({ note }: { note?: string | null }) {
  const c = cabinFromNote(note)
  if (!c) return null // Economy — no badge (it's the default)
  const cls = c === 'Business' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-700'
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{c === 'Business' ? '✦ Business' : '⬆ Prem. Eco'}</span>
}

interface DestGroup {
  iata: string; city: string; image: string; from: number; currency: string
  count: number; origins: number; deals: Deal[]; maxDisc: number
}

export default function DestinationGrid({ deals }: { deals: Deal[] }) {
  const [city, setCity] = useState('All cities')
  const [trip, setTrip] = useState<'All' | 'oneway' | 'roundtrip'>('All')
  const [cabin, setCabin] = useState('All classes')
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [openDest, setOpenDest] = useState<DestGroup | null>(null)

  const cityOptions = useMemo(
    () => ['All cities', ...Array.from(new Set(deals.map(d => d.origin_city))).sort()],
    [deals],
  )

  const filtered = deals.filter(d =>
    (city === 'All cities' || d.origin_city === city) &&
    (trip === 'All' || tripFromNote(d.curator_note) === trip) &&
    (cabin === 'All classes' || cabinKey(d.curator_note) === cabin),
  )

  const dests: DestGroup[] = useMemo(() => {
    const groups: Record<string, Deal[]> = {}
    for (const d of filtered) (groups[d.dest_iata] = groups[d.dest_iata] || []).push(d)
    return Object.entries(groups).map(([iata, ds]) => {
      const sorted = [...ds].sort((a, b) => a.deal_price - b.deal_price)
      const c = sorted[0]
      return {
        iata, city: c.dest_city, image: c.image_url, from: c.deal_price, currency: c.currency,
        count: sorted.length, origins: new Set(ds.map(d => d.origin_iata)).size, deals: sorted,
        maxDisc: Math.max(...ds.map(d => calcDiscount(d.normal_price, d.deal_price))),
      }
    }).sort((a, b) => a.from - b.from)
  }, [filtered])

  const monthGroups = useMemo(() => {
    const g: Record<string, Deal[]> = {}
    for (const d of filtered) {
      const key = (d.validity_start || '').slice(0, 7) // YYYY-MM
      if (key) (g[key] = g[key] || []).push(d)
    }
    return Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, ds]) => ({
        key,
        label: new Date(key + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        deals: [...ds].sort((a, b) => a.deal_price - b.deal_price),
      }))
  }, [filtered])

  const pill = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-bold transition-colors ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4 mb-7 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Flying from</span>
          <select value={city} onChange={e => setCity(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]">
            {cityOptions.map(o => <option key={o} value={o}>{o === 'All cities' ? '🏠 All home cities' : o}</option>)}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Trip type</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-full">
            {([['All', 'All'], ['oneway', 'One way'], ['roundtrip', 'Round trip']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTrip(k)} className={pill(trip === k)}>{label}</button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Class</span>
          <select value={cabin} onChange={e => setCabin(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            {['All classes', 'Economy', 'Premium Economy', 'Business'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <div className="ml-auto flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400 text-right">View</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-full">
            <button onClick={() => setView('grid')} className={pill(view === 'grid')}>🗂 Destinations</button>
            <button onClick={() => setView('list')} className={pill(view === 'list')}>📅 By month</button>
          </div>
        </div>
      </div>

      <p className="text-slate-500 text-sm mb-5">
        {view === 'grid'
          ? `${dests.length} destination${dests.length !== 1 ? 's' : ''} · ${filtered.length} fares`
          : `${filtered.length} fare${filtered.length !== 1 ? 's' : ''}`}
        {city !== 'All cities' ? ` from ${city}` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-slate-600 font-semibold">No fares match these filters.</p>
        </div>
      ) : view === 'grid' ? (
        /* ── Destination tiles ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {dests.map(dst => (
            <button key={dst.iata} onClick={() => setOpenDest(dst)}
              className="group text-left bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image src={dst.image} alt={dst.city} fill sizes="(max-width:640px) 100vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {dst.maxDisc > 0 && (
                  <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">up to {dst.maxDisc}% off</span>
                )}
                <div className="absolute bottom-2.5 left-3 right-3">
                  <p className="text-lg leading-none mb-1">{FLAG[dst.iata] ?? '✈️'}</p>
                  <p className="font-display text-white text-xl font-bold leading-tight">{dst.city}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-400 font-medium">from</p>
                <p className="font-display text-2xl font-bold text-slate-900 leading-tight">{formatPrice(dst.from, dst.currency)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{dst.origins} {dst.origins === 1 ? 'city' : 'cities'} · {dst.count} fare{dst.count !== 1 ? 's' : ''}</span>
                  <span className="text-blue-600 text-sm font-bold group-hover:translate-x-0.5 transition-transform">View fares →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* ── Month sections (all fares under each month) ── */
        <div className="space-y-12">
          {monthGroups.map(mg => (
            <div key={mg.key}>
              <div className="flex items-center gap-3 mb-5">
                <h3 className="font-display text-xl font-bold text-slate-800">📅 {mg.label}</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                  {mg.deals.length} deal{mg.deals.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {mg.deals.map((deal, i) => {
                  const disc = calcDiscount(deal.normal_price, deal.deal_price)
                  const oneWay = tripFromNote(deal.curator_note) === 'oneway'
                  return (
                    <Link key={deal.id} href={`/deal/${deal.id}`}
                      data-deal-id={deal.id} data-surface="grid" data-position={i}
                      className="group flex sm:flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 sm:hover:-translate-y-1 transition-all duration-300">
                      {/* Image: compact left on mobile, full image-forward on desktop */}
                      <div className="relative w-28 shrink-0 sm:w-full sm:aspect-[3/2] overflow-hidden">
                        <Image src={deal.image_url} alt={deal.dest_city} fill sizes="(max-width:640px) 112px, 300px"
                          className="object-cover sm:group-hover:scale-105 transition-transform duration-500" />
                        <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <div className="hidden sm:block absolute bottom-2.5 left-3 right-3">
                          <p className="text-white/85 text-base leading-none mb-0.5">{FLAG[deal.dest_iata] ?? '✈️'}</p>
                          <p className="font-display text-white text-lg font-bold leading-tight">{deal.dest_city}</p>
                        </div>
                        {disc > 0 && <span className="hidden sm:block absolute top-2.5 left-2.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{disc}% off</span>}
                      </div>
                      {/* Body */}
                      <div className="p-3 sm:p-4 flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate sm:hidden">{FLAG[deal.dest_iata] ?? '✈️'} {deal.dest_city}</p>
                        <p className="text-xs text-slate-500 truncate">{deal.origin_city} {oneWay ? '→' : '⇄'} {deal.dest_city}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{deal.airline} · {mon(deal.validity_start)} · {oneWay ? 'One way' : 'Round trip'}</p>
                        <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                          <span className="font-display font-bold text-slate-900 sm:text-xl">{formatPrice(deal.deal_price, deal.currency)}</span>
                          {disc > 0 && <span className="text-[11px] font-bold text-emerald-600 sm:hidden">{disc}% off</span>}
                          <CabinBadge note={deal.curator_note} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Destination modal */}
      {openDest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-5" onClick={() => setOpenDest(null)}>
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="relative h-36 shrink-0">
              <Image src={openDest.image} alt={openDest.city} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
              <button onClick={() => setOpenDest(null)} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full font-bold text-slate-700 hover:bg-white">✕</button>
              <div className="absolute bottom-3 left-4">
                <p>{FLAG[openDest.iata] ?? '✈️'}</p>
                <h3 className="font-display text-2xl font-bold text-white">{openDest.city}</h3>
                <p className="text-white/80 text-sm">{openDest.count} fares · from {formatPrice(openDest.from, openDest.currency)}</p>
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {openDest.deals.map((deal, i) => {
                const disc = calcDiscount(deal.normal_price, deal.deal_price)
                const oneWay = tripFromNote(deal.curator_note) === 'oneway'
                return (
                  <Link key={deal.id} href={`/deal/${deal.id}`}
                    data-deal-id={deal.id} data-surface="spotlight" data-position={i}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                        <span>{deal.origin_city} {oneWay ? '→' : '⇄'} {deal.dest_city}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{oneWay ? 'One way' : 'Round trip'}</span>
                        <CabinBadge note={deal.curator_note} />
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{deal.airline} · {mon(deal.validity_start)}{deal.validity_start !== deal.validity_end ? `–${mon(deal.validity_end)}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-slate-900">{formatPrice(deal.deal_price, deal.currency)}</p>
                      {disc > 0 && <p className="text-[11px] font-bold text-emerald-600">{disc}% off</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

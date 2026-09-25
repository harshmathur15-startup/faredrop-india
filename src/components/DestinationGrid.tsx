'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Deal } from '@/types'
import { formatPrice, calcDiscount, tripFromNote, cabinFromNote, stopsFromNote, isDomestic, isIndianAirport } from '@/lib/utils'

const FLAG: Record<string, string> = {
  BKK: '🇹🇭', DMK: '🇹🇭', HKT: '🇹🇭', DPS: '🇮🇩', CGK: '🇮🇩', SIN: '🇸🇬',
  DXB: '🇦🇪', AUH: '🇦🇪', DOH: '🇶🇦', LHR: '🇬🇧', CDG: '🇫🇷', AMS: '🇳🇱',
  FCO: '🇮🇹', VIE: '🇦🇹', GVA: '🇨🇭', ZRH: '🇨🇭', MUC: '🇩🇪', TBS: '🇬🇪',
  IST: '🇹🇷', CAI: '🇪🇬', NRT: '🇯🇵', HND: '🇯🇵', ICN: '🇰🇷', HKG: '🇭🇰',
  PVG: '🇨🇳', PEK: '🇨🇳', HAN: '🇻🇳', SGN: '🇻🇳', KUL: '🇲🇾', CMB: '🇱🇰',
  MLE: '🇲🇻', GAN: '🇲🇻', MEL: '🇦🇺', SYD: '🇦🇺', YYZ: '🇨🇦', JFK: '🇺🇸',
  GOI: '🇮🇳', GOX: '🇮🇳', IXL: '🇮🇳', COK: '🇮🇳', UDR: '🇮🇳', SXR: '🇮🇳',
  KTM: '🇳🇵', IXB: '🇮🇳', IXZ: '🇮🇳', DED: '🇮🇳', JAI: '🇮🇳', VNS: '🇮🇳',
  TAS: '🇺🇿', ALA: '🇰🇿', EVN: '🇦🇲', TPE: '🇹🇼', DAC: '🇧🇩',
  LON: '🇬🇧', LGW: '🇬🇧', PAR: '🇫🇷', NYC: '🇺🇸', AKL: '🇳🇿', MAD: '🇪🇸',
  KWI: '🇰🇼', RUH: '🇸🇦', BAH: '🇧🇭', MCT: '🇴🇲',
}
// Any Indian airport falls back to the India flag; everything else to a plane.
const flagFor = (iata: string) => FLAG[iata] ?? (isIndianAirport(iata) ? '🇮🇳' : '✈️')
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
  monthLabel?: string; groupKey?: string   // set when the group is scoped to a month
}

export default function DestinationGrid({ deals, lockedIds, lockHref = '/pricing', onUnlock, credits }: {
  deals: Deal[]
  lockedIds?: Set<string>
  lockHref?: string                     // where a locked card navigates when there's no unlock handler (anon → /signup)
  onUnlock?: (dealId: string) => void   // if provided (free users), locked cards become "Unlock (1 credit)" actions
  credits?: number                      // remaining unlock credits — shown as a chip + drives the locked-card label
}) {
  const isLocked = (d: Deal) => lockedIds?.has(d.id) ?? false
  const canUnlock = !!onUnlock && (credits ?? 0) > 0
  const [city, setCity] = useState('All cities')
  const [trip, setTrip] = useState<'All' | 'oneway' | 'roundtrip'>('All')
  const [cabin, setCabin] = useState('All classes')
  const [scope, setScope] = useState<'All' | 'domestic' | 'international'>('All')
  const [stops, setStops] = useState<'All' | '0' | '1' | '2'>('All')
  const [openDest, setOpenDest] = useState<DestGroup | null>(null)

  // Persist filters across navigation so the browser Back button restores the
  // exact filtered view (previously filters reset to defaults on returning from
  // a deal page). Restore on mount from sessionStorage; save on every change.
  const [hydrated, setHydrated] = useState(false)
  const pendingOpenRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('tb_deal_filters') || '{}')
      if (typeof saved.city === 'string') setCity(saved.city)
      if (saved.trip === 'All' || saved.trip === 'oneway' || saved.trip === 'roundtrip') setTrip(saved.trip)
      if (typeof saved.cabin === 'string') setCabin(saved.cabin)
      if (saved.scope === 'All' || saved.scope === 'domestic' || saved.scope === 'international') setScope(saved.scope)
      if (saved.stops === 'All' || saved.stops === '0' || saved.stops === '1' || saved.stops === '2') setStops(saved.stops)
      pendingOpenRef.current = typeof saved.openKey === 'string' ? saved.openKey : null
    } catch { /* ignore corrupt/unavailable storage */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return // don't overwrite saved state with defaults before restore
    try {
      sessionStorage.setItem('tb_deal_filters', JSON.stringify({ city, trip, cabin, scope, stops, openKey: openDest?.groupKey ?? null }))
    } catch { /* ignore */ }
  }, [hydrated, city, trip, cabin, scope, stops, openDest])

  const cityOptions = useMemo(
    () => ['All cities', ...Array.from(new Set(deals.map(d => d.origin_city))).sort()],
    [deals],
  )

  const stopsBucket = (n: number | null): '0' | '1' | '2' | null =>
    n === null ? null : n <= 0 ? '0' : n === 1 ? '1' : '2'

  const filtered = deals.filter(d =>
    (city === 'All cities' || d.origin_city === city) &&
    (trip === 'All' || tripFromNote(d.curator_note) === trip) &&
    (cabin === 'All classes' || cabinKey(d.curator_note) === cabin) &&
    (scope === 'All' || (isDomestic(d.origin_iata, d.dest_iata) ? scope === 'domestic' : scope === 'international')) &&
    (stops === 'All' || stopsBucket(stopsFromNote(d.curator_note)) === stops),
  )

  // One card per destination *per month*: group by month, then by destination.
  // Tapping a destination tile opens that month's 2-3 deals in the modal.
  const monthDestGroups = useMemo(() => {
    const byMonth: Record<string, Deal[]> = {}
    for (const d of filtered) {
      const key = (d.validity_start || '').slice(0, 7) // YYYY-MM
      if (key) (byMonth[key] = byMonth[key] || []).push(d)
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, ds]) => {
        const label = new Date(key + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        const byDest: Record<string, Deal[]> = {}
        for (const d of ds) (byDest[d.dest_iata] = byDest[d.dest_iata] || []).push(d)
        const dests: DestGroup[] = Object.entries(byDest).map(([iata, dl]) => {
          const sorted = [...dl].sort((a, b) => a.deal_price - b.deal_price)
          const c = sorted[0]
          return {
            iata, city: c.dest_city, image: c.image_url, from: c.deal_price, currency: c.currency,
            count: sorted.length, origins: new Set(dl.map(d => d.origin_iata)).size, deals: sorted,
            maxDisc: Math.max(...dl.map(d => calcDiscount(d.normal_price, d.deal_price))),
            monthLabel: label, groupKey: `${key}::${iata}`,
          }
        }).sort((a, b) => a.from - b.from)
        return { key, label, dests }
      })
  }, [filtered])

  const totalDests = monthDestGroups.reduce((n, mg) => n + mg.dests.length, 0)

  // Re-open the destination panel the user had open before navigating away.
  useEffect(() => {
    if (!hydrated || !pendingOpenRef.current) return
    for (const mg of monthDestGroups) {
      const g = mg.dests.find(d => d.groupKey === pendingOpenRef.current)
      if (g) { setOpenDest(g); break }
    }
    pendingOpenRef.current = null
  }, [hydrated, monthDestGroups])

  const pill = (active: boolean) =>
    `px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`

  // Shared chip styling so dropdowns and segmented toggles line up on one compact row.
  const selectChip = 'shrink-0 h-9 rounded-full border border-slate-200 bg-white pl-3.5 pr-8 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
  const segGroup = 'shrink-0 inline-flex h-9 items-center p-0.5 bg-slate-100 rounded-full'

  return (
    <>
      {/* Filter bar — single line; swipes horizontally on mobile */}
      <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 mb-7 p-2 sm:p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <select aria-label="Flying from" value={city} onChange={e => setCity(e.target.value)}
          className={`${selectChip} min-w-[140px]`}>
          {cityOptions.map(o => <option key={o} value={o}>{o === 'All cities' ? '🏠 Home cities' : o}</option>)}
        </select>

        <div role="group" aria-label="Region" className={segGroup}>
          {([['All', 'All'], ['domestic', '🇮🇳 Domestic'], ['international', '🌍 International']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setScope(k)} className={pill(scope === k)}>{label}</button>
          ))}
        </div>

        <div role="group" aria-label="Trip type" className={segGroup}>
          {([['All', 'All'], ['oneway', 'One way'], ['roundtrip', 'Round trip']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTrip(k)} className={pill(trip === k)}>{label}</button>
          ))}
        </div>

        <select aria-label="Class" value={cabin} onChange={e => setCabin(e.target.value)}
          className={selectChip}>
          {['All classes', 'Economy', 'Premium Economy', 'Business'].map(o => (
            <option key={o} value={o}>{o === 'All classes' ? 'Classes' : o}</option>
          ))}
        </select>

        <select aria-label="Stops" value={stops} onChange={e => setStops(e.target.value as typeof stops)}
          className={selectChip}>
          {([['All', 'Stops'], ['0', 'Non-stop'], ['1', '1 stop'], ['2', '2+ stops']] as const).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Unlock-credits banner — only for signed-in free users (onUnlock provided) */}
      {onUnlock && credits !== undefined && (
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap rounded-2xl px-4 py-3 border bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          {credits > 0 ? (
            <p className="text-sm font-semibold text-slate-700">
              🔓 You have <span className="text-blue-700 font-bold">{credits} free unlock{credits === 1 ? '' : 's'}</span> this month — tap a 🔒 deal to reveal its dates &amp; booking link.
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-700">
              You&apos;ve used all your free unlocks this month. Upgrade for unlimited access, or they refresh next month.
            </p>
          )}
          <Link href="/pricing" className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full transition-colors">
            {credits > 0 ? 'Unlock everything →' : 'Upgrade →'}
          </Link>
        </div>
      )}

      <p className="text-slate-500 text-sm mb-5">
        {`${filtered.length} fare${filtered.length !== 1 ? 's' : ''} · ${totalDests} destination${totalDests !== 1 ? 's' : ''} across ${monthDestGroups.length} month${monthDestGroups.length !== 1 ? 's' : ''}`}
        {city !== 'All cities' ? ` from ${city}` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-slate-600 font-semibold">No fares match these filters.</p>
        </div>
      ) : (
        /* ── Months → one tile per destination; tap a tile to see that month's deals ── */
        <div className="space-y-12">
          {monthDestGroups.map(mg => (
            <div key={mg.key}>
              <div className="flex items-center gap-3 mb-5">
                <h3 className="font-display text-xl font-bold text-slate-800">📅 {mg.label}</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                  {mg.dests.length} destination{mg.dests.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {mg.dests.map(dst => (
                  <button key={dst.groupKey} onClick={() => setOpenDest(dst)}
                    className="group text-left bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-[3/2] w-full overflow-hidden">
                      <Image src={dst.image} alt={dst.city} fill sizes="(max-width:640px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      {dst.maxDisc > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">up to {dst.maxDisc}% off</span>
                      )}
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <p className="text-lg leading-none mb-1">{flagFor(dst.iata)}</p>
                        <p className="font-display text-white text-xl font-bold leading-tight">{dst.city}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-400 font-medium">from</p>
                      <p className="font-display text-2xl font-bold text-slate-900 leading-tight">{formatPrice(dst.from, dst.currency)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">{dst.count} deal{dst.count !== 1 ? 's' : ''}</span>
                        <span className="text-blue-600 text-sm font-bold group-hover:translate-x-0.5 transition-transform">View deals →</span>
                      </div>
                    </div>
                  </button>
                ))}
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
                <p>{flagFor(openDest.iata)}</p>
                <h3 className="font-display text-2xl font-bold text-white">{openDest.city}</h3>
                <p className="text-white/80 text-sm">{openDest.monthLabel ? `${openDest.monthLabel} · ` : ''}{openDest.count} deal{openDest.count !== 1 ? 's' : ''} · from {formatPrice(openDest.from, openDest.currency)}</p>
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {openDest.deals.map((deal, i) => {
                const disc = calcDiscount(deal.normal_price, deal.deal_price)
                const oneWay = tripFromNote(deal.curator_note) === 'oneway'
                const locked = isLocked(deal)
                const showUnlock = locked && !!onUnlock
                const subLine = locked
                  ? (showUnlock ? (canUnlock ? '🔓 Tap to unlock · 1 credit' : 'Out of credits — upgrade →') : 'Unlock exact dates & booking →')
                  : `${deal.airline} · ${mon(deal.validity_start)}${deal.validity_start !== deal.validity_end ? `–${mon(deal.validity_end)}` : ''}`
                const rowCls = 'flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition-colors'
                const inner = (
                  <>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                        <span>{deal.origin_city} {oneWay ? '→' : '⇄'} {deal.dest_city}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{oneWay ? 'One way' : 'Round trip'}</span>
                        <CabinBadge note={deal.curator_note} />
                        {locked && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{showUnlock ? (canUnlock ? '🔓 Unlock' : '🔒 Upgrade') : '🔒 Members'}</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{subLine}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-slate-900">{formatPrice(deal.deal_price, deal.currency)}</p>
                      {disc > 0 && <p className="text-[11px] font-bold text-emerald-600">{disc}% off</p>}
                    </div>
                  </>
                )
                if (showUnlock) {
                  return (
                    <div key={deal.id} role="button" tabIndex={0}
                      onClick={() => onUnlock!(deal.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUnlock!(deal.id) } }}
                      data-deal-id={deal.id} data-surface="spotlight" data-position={i} data-locked="true"
                      className={`${rowCls} w-full text-left cursor-pointer`}>
                      {inner}
                    </div>
                  )
                }
                return (
                  <Link key={deal.id} href={locked ? lockHref : `/deal/${deal.id}`}
                    data-deal-id={deal.id} data-surface="spotlight" data-position={i} data-locked={locked ? 'true' : undefined}
                    className={rowCls}>
                    {inner}
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

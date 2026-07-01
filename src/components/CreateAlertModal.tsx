'use client'

import { useState, useRef, useEffect } from 'react'
import { searchAirports, type Airport } from '@/lib/airports'

interface Props {
  onClose: () => void
  onCreated: (alert: Record<string, unknown>) => void
}

const CABINS = [
  { value: 'economy',         label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business',        label: 'Business' },
  { value: 'first',           label: 'First Class' },
]

const MONTHS: { value: string; label: string }[] = (() => {
  const out: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    out.push({ value, label })
  }
  return out
})()

function AirportPicker({
  label, value, onChange,
}: {
  label: string
  value: Airport | null
  onChange: (a: Airport | null) => void
}) {
  const [query, setQuery]       = useState(value ? `${value.city} (${value.iata})` : '')
  const [results, setResults]   = useState<Airport[]>([])
  const [open, setOpen]         = useState(false)
  const ref                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setResults(searchAirports(q))
    setOpen(true)
    if (!q) onChange(null)
  }

  function select(a: Airport) {
    onChange(a)
    setQuery(`${a.city} (${a.iata})`)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => { setResults(searchAirports(query)); setOpen(true) }}
        placeholder="City or IATA code…"
        autoComplete="off"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {results.map(a => (
            <button key={a.iata} type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3"
              onMouseDown={() => select(a)}>
              <span className="font-black text-blue-700 text-sm w-10 shrink-0">{a.iata}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{a.city}</p>
                <p className="text-xs text-gray-400">{a.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateAlertModal({ onClose, onCreated }: Props) {
  const [origin,       setOrigin]       = useState<Airport | null>(null)
  const [dest,         setDest]         = useState<Airport | null>(null)
  const [targetPrice,  setTargetPrice]  = useState('')
  const [cabin,        setCabin]        = useState('economy')
  const [tripType,     setTripType]     = useState('roundtrip')
  const [travelMonth,  setTravelMonth]  = useState('')
  const [flexDates,    setFlexDates]    = useState(false)
  const [status,       setStatus]       = useState<'idle' | 'loading'>('idle')
  const [error,        setError]        = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!origin) { setError('Please select an origin airport.'); return }
    if (!dest)   { setError('Please select a destination airport.'); return }
    if (origin.iata === dest.iata) { setError('Origin and destination must differ.'); return }

    const price = Number(targetPrice)
    if (!price || price < 1000) { setError('Enter a target price of at least ₹1,000.'); return }

    setStatus('loading')
    try {
      const res = await fetch('/api/alerts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_iata:    origin.iata,
          dest_iata:      dest.iata,
          target_price:   price,
          cabin_class:    cabin,
          trip_type:      tripType,
          travel_month:   travelMonth || null,
          flexible_dates: flexDates,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create alert.'); setStatus('idle'); return }
      onCreated(data.alert)
    } catch {
      setError('Network error — please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-slate-900">New price alert</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <AirportPicker label="From (origin)" value={origin} onChange={setOrigin} />
          <AirportPicker label="To (destination)" value={dest} onChange={setDest} />

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
              Target price (₹)
            </label>
            <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
              <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm font-semibold border-r border-gray-300">₹</span>
              <input type="number" min={1000} max={1000000} step={500} required
                value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                placeholder="45000"
                className="flex-1 px-4 py-3 focus:outline-none text-gray-900 text-sm" />
            </div>
            <p className="text-xs text-gray-400 mt-1">We'll alert you when prices reach or drop below this.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Cabin</label>
              <select value={cabin} onChange={e => setCabin(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white cursor-pointer">
                {CABINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Trip type</label>
              <select value={tripType} onChange={e => setTripType(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white cursor-pointer">
                <option value="roundtrip">Round trip</option>
                <option value="oneway">One way</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
              Travel month <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <select value={travelMonth} onChange={e => setTravelMonth(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white cursor-pointer">
              <option value="">Any month</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={flexDates} onChange={e => setFlexDates(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm text-gray-700">Flexible dates (±3 days)</span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm">
            {status === 'loading' ? 'Creating…' : 'Create alert →'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import ExploreResultCard from '@/components/ExploreResultCard'
import SignupForm from '@/components/SignupForm'
import Link from 'next/link'

const ORIGINS = [
  { city: 'Delhi', iata: 'DEL' },
  { city: 'Mumbai', iata: 'BOM' },
  { city: 'Bangalore', iata: 'BLR' },
  { city: 'Chennai', iata: 'MAA' },
  { city: 'Hyderabad', iata: 'HYD' },
]

const REGIONS = [
  'Southeast Asia',
  'Middle East',
  'East Asia',
  'Europe',
  'Americas',
  'South Asia / Indian Ocean',
  'Africa & Australia',
]

const BUDGETS = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under ₹15,000', value: '15000' },
  { label: 'Under ₹25,000', value: '25000' },
  { label: 'Under ₹50,000', value: '50000' },
  { label: 'Under ₹1,00,000', value: '100000' },
]

function getNextMonths(count = 12) {
  const months = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push({
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return months
}

interface ExploreResult {
  origin_iata: string
  dest_iata: string
  dest_city: string
  price: number
  baseline: number
  airline: string
  stops: number
  is_direct: boolean
  trip_type: string
  departure_date: string
  return_date: string | null
  google_flights_url: string
  discount_pct: number
  tier: string
}

export default function ExplorePage() {
  const [origin, setOrigin] = useState('DEL')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [month, setMonth] = useState('anytime')
  const [budget, setBudget] = useState('any')
  const [tripType, setTripType] = useState('return')
  const [maxStops, setMaxStops] = useState('one-stop')
  const [results, setResults] = useState<ExploreResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [sources, setSources] = useState<{ supabase: number; serpapi: number; baseline: number } | null>(null)

  const months = getNextMonths()

  function toggleRegion(r: string) {
    setSelectedRegions(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    )
  }

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    setResults([])

    const res = await fetch('/api/explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        regions: selectedRegions,
        month,
        budget,
        trip_type: tripType,
        max_stops: maxStops,
      }),
    })

    const data = await res.json()
    setResults(data.results ?? [])
    setFromCache(data.from_cache ?? false)
    setSources(data.sources ?? null)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-blue-600 tracking-tight">✈ Travelbaby</Link>
        <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-blue-600">View curated deals</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900">Explore flight deals</h1>
          <p className="text-gray-500 mt-2 text-lg">Tell us where you want to go. We&apos;ll find the best prices live.</p>
        </div>

        {/* Preferences form */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-6">

          {/* Origin */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Flying from</label>
            <div className="flex flex-wrap gap-2">
              {ORIGINS.map(o => (
                <button key={o.iata} type="button" onClick={() => setOrigin(o.iata)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${origin === o.iata ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {o.city}
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Where to? <span className="font-normal text-gray-400">(leave blank for everywhere)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button key={r} type="button" onClick={() => toggleRegion(r)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedRegions.includes(r) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Month + Budget row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">When?</label>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="anytime">Anytime (next 6 weeks)</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Budget (per person)</label>
              <select value={budget} onChange={e => setBudget(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm">
                {BUDGETS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip type + Stops row */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm font-bold text-gray-700 mb-1">Trip type</p>
              <div className="flex rounded-xl border border-gray-300 overflow-hidden text-sm">
                {[{ label: '⇄ Return', value: 'return' }, { label: '→ One-way', value: 'one-way' }].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTripType(opt.value)}
                    className={`px-4 py-2 font-medium transition-colors ${tripType === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 mb-1">Stops</p>
              <div className="flex rounded-xl border border-gray-300 overflow-hidden text-sm">
                {[{ label: '✈ Direct only', value: 'direct' }, { label: 'Max 1 stop', value: 'one-stop' }].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setMaxStops(opt.value)}
                    className={`px-4 py-2 font-medium transition-colors ${maxStops === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Searching live prices...' : 'Search deals ✈'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-8">
            {loading && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 animate-bounce">✈️</div>
                <p className="text-gray-500 font-medium">Scanning live prices across {selectedRegions.length || 'all'} regions...</p>
                <p className="text-gray-400 text-sm mt-1">This takes 10–20 seconds</p>
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-4xl mb-3">🤷</p>
                <p className="text-gray-700 font-semibold">No deals found matching your filters</p>
                <p className="text-gray-400 text-sm mt-1">Try a wider region, higher budget, or different month</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-gray-900">
                    {results.length} deals found
                  </h2>
                  <div className="flex items-center gap-2">
                    {fromCache && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Cached</span>}
                  {sources && sources.baseline > 0 && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      {sources.baseline} routes showing estimated prices — click to verify on Google Flights
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Sorted by best deal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((r, i) => (
                    <ExploreResultCard key={i} result={r} />
                  ))}
                </div>

                {/* Email capture */}
                <div className="mt-10 bg-blue-600 rounded-2xl p-6 text-center text-white">
                  <h3 className="text-xl font-black mb-1">Want to be the first to know?</h3>
                  <p className="text-blue-100 text-sm mb-4">Get curated deal alerts when prices drop 40%+ on your favourite routes.</p>
                  <SignupForm />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

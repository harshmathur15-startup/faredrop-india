'use client'

import { useState, useCallback } from 'react'

interface Suggestion {
  origin_city: string
  origin_iata: string
  dest_city: string
  dest_iata: string
  price: number
  baseline: number
  currency: string
  airline: string
  stops: number
  is_direct: boolean
  trip_type: 'return' | 'one-way'
  departure_date: string
  return_date: string | null
  source_url: string
  discount_pct: number
  tier: 'glitch' | 'exceptional' | 'great' | 'good' | 'normal'
  warning: string | null
  using_real_baseline: boolean
}

const TIER_CONFIG = {
  glitch:      { label: '⚡ Glitch fare',   bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-500' },
  exceptional: { label: '🔥 Exceptional',   bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    badge: 'bg-red-500' },
  great:       { label: '🟢 Great deal',    bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-500' },
  good:        { label: '🟡 Good deal',     bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500' },
  normal:      { label: 'Normal price',     bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   badge: 'bg-gray-400' },
}

const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY

const AIRLINES = ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 'Thai Airways', 'AirAsia', 'Other']

const CITIES: { city: string; iata: string }[] = [
  { city: 'Delhi', iata: 'DEL' },
  { city: 'Mumbai', iata: 'BOM' },
  { city: 'Bangalore', iata: 'BLR' },
  { city: 'Chennai', iata: 'MAA' },
  { city: 'Hyderabad', iata: 'HYD' },
  { city: 'Kolkata', iata: 'CCU' },
]

const DEST_CITIES = [
  // SE Asia
  { city: 'Bali', iata: 'DPS' }, { city: 'Bangkok', iata: 'BKK' },
  { city: 'Singapore', iata: 'SIN' }, { city: 'Kuala Lumpur', iata: 'KUL' },
  { city: 'Phuket', iata: 'HKT' }, { city: 'Ho Chi Minh City', iata: 'SGN' },
  { city: 'Hanoi', iata: 'HAN' }, { city: 'Manila', iata: 'MNL' },
  { city: 'Jakarta', iata: 'CGK' },
  // South Asia / Indian Ocean
  { city: 'Male', iata: 'MLE' }, { city: 'Colombo', iata: 'CMB' },
  { city: 'Kathmandu', iata: 'KTM' },
  // Middle East
  { city: 'Dubai', iata: 'DXB' }, { city: 'Abu Dhabi', iata: 'AUH' },
  { city: 'Doha', iata: 'DOH' }, { city: 'Muscat', iata: 'MCT' },
  // East Asia
  { city: 'Tokyo', iata: 'NRT' }, { city: 'Osaka', iata: 'KIX' },
  { city: 'Seoul', iata: 'ICN' }, { city: 'Hong Kong', iata: 'HKG' },
  { city: 'Taipei', iata: 'TPE' }, { city: 'Beijing', iata: 'PEK' },
  // Europe
  { city: 'London', iata: 'LHR' }, { city: 'Paris', iata: 'CDG' },
  { city: 'Amsterdam', iata: 'AMS' }, { city: 'Frankfurt', iata: 'FRA' },
  { city: 'Rome', iata: 'FCO' }, { city: 'Barcelona', iata: 'BCN' },
  { city: 'Zurich', iata: 'ZRH' }, { city: 'Vienna', iata: 'VIE' },
  { city: 'Istanbul', iata: 'IST' },
  // Americas
  { city: 'New York', iata: 'JFK' }, { city: 'Los Angeles', iata: 'LAX' },
  { city: 'Toronto', iata: 'YYZ' }, { city: 'Vancouver', iata: 'YVR' },
  { city: 'San Francisco', iata: 'SFO' },
  // Africa
  { city: 'Nairobi', iata: 'NBO' }, { city: 'Cape Town', iata: 'CPT' },
  { city: 'Johannesburg', iata: 'JNB' },
  // Australia
  { city: 'Sydney', iata: 'SYD' }, { city: 'Melbourne', iata: 'MEL' },
]

interface DealCandidate {
  id: string
  source: string
  origin_iata: string | null
  dest_iata: string | null
  airline: string | null
  price_inr: number | null
  currency: string
  travel_start: string | null
  travel_end: string | null
  raw_payload: string
  raw_url: string | null
  status: string
  created_at: string
}

interface FormState {
  origin_city: string
  origin_iata: string
  dest_city: string
  dest_iata: string
  airline: string
  normal_price: string
  deal_price: string
  currency: string
  validity_start: string
  validity_end: string
  source_url: string
  image_url: string
  curator_note: string
  admin_secret: string
}

export default function AdminPage() {
  const [form, setForm] = useState<FormState>({
    origin_city: '', origin_iata: '', dest_city: '', dest_iata: '',
    airline: '', normal_price: '', deal_price: '', currency: 'INR',
    validity_start: '', validity_end: '', source_url: '', image_url: '',
    curator_note: '', admin_secret: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [photoResults, setPhotoResults] = useState<{ src: { medium: string } }[]>([])
  const [photoQuery, setPhotoQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsOrigin, setSuggestionsOrigin] = useState('DEL')
  const [suggestionsError, setSuggestionsError] = useState('')
  const [tripType, setTripType] = useState<'1' | '2'>('1')
  const [maxStops, setMaxStops] = useState<'1' | '2'>('2')
  const [activeTab, setActiveTab] = useState<'candidates' | 'suggestions' | 'publish'>('candidates')
  const [candidates, setCandidates] = useState<DealCandidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)

  async function fetchCandidates() {
    if (!form.admin_secret) { alert('Enter admin password first'); return }
    setCandidatesLoading(true)
    const res = await fetch('/api/admin/candidates', {
      headers: { 'x-admin-token': form.admin_secret },
    })
    const data = await res.json()
    setCandidates(data.candidates ?? [])
    setCandidatesLoading(false)
  }

  async function rejectCandidate(id: string) {
    await fetch('/api/admin/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': form.admin_secret },
      body: JSON.stringify({ id, status: 'rejected' }),
    })
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  function useCandidate(c: DealCandidate) {
    const IATA_TO_CITY: Record<string, string> = {
      DEL:'Delhi',BOM:'Mumbai',BLR:'Bangalore',MAA:'Chennai',HYD:'Hyderabad',CCU:'Kolkata',
      DPS:'Bali',BKK:'Bangkok',SIN:'Singapore',KUL:'Kuala Lumpur',HKT:'Phuket',
      SGN:'Ho Chi Minh City',HAN:'Hanoi',MNL:'Manila',DXB:'Dubai',AUH:'Abu Dhabi',
      DOH:'Doha',MCT:'Muscat',NRT:'Tokyo',KIX:'Osaka',ICN:'Seoul',HKG:'Hong Kong',
      TPE:'Taipei',LHR:'London',CDG:'Paris',AMS:'Amsterdam',FRA:'Frankfurt',
      FCO:'Rome',BCN:'Barcelona',IST:'Istanbul',JFK:'New York',LAX:'Los Angeles',
      YYZ:'Toronto',SFO:'San Francisco',MLE:'Male',CMB:'Colombo',KTM:'Kathmandu',
      NBO:'Nairobi',JNB:'Johannesburg',SYD:'Sydney',MEL:'Melbourne',
    }
    setForm(prev => ({
      ...prev,
      origin_city: IATA_TO_CITY[c.origin_iata ?? ''] ?? c.origin_iata ?? '',
      origin_iata: c.origin_iata ?? '',
      dest_city: IATA_TO_CITY[c.dest_iata ?? ''] ?? c.dest_iata ?? '',
      dest_iata: c.dest_iata ?? '',
      airline: c.airline ?? '',
      deal_price: c.price_inr ? String(c.price_inr) : '',
      validity_start: c.travel_start ?? '',
      validity_end: c.travel_end ?? '',
      source_url: c.raw_url ?? '',
    }))
    if (c.dest_iata) searchPhotos(IATA_TO_CITY[c.dest_iata] ?? c.dest_iata)
    setActiveTab('publish')
  }

  const fetchSuggestions = useCallback(async (origin: string) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!form.admin_secret) { alert('Enter admin password first'); return }
    setSuggestionsLoading(true)
    setSuggestions([])
    setSuggestionsError('')
    const res = await fetch(`/api/suggestions?origin=${origin}&trip_type=${tripType}&max_stops=${maxStops}`, {
      headers: { 'x-admin-token': form.admin_secret },
    })
    const data = await res.json()
    if (!res.ok) {
      setSuggestionsError(data.error ?? 'Failed to fetch suggestions')
    } else {
      setSuggestions(data.suggestions ?? [])
      if (data.errors?.length) setSuggestionsError(`Some routes failed: ${data.errors.join(', ')}`)
    }
    setSuggestionsLoading(false)
  }, [form.admin_secret, tripType, maxStops])

  function useSuggestion(s: Suggestion) {
    setForm(prev => ({
      ...prev,
      origin_city: s.origin_city,
      origin_iata: s.origin_iata,
      dest_city: s.dest_city,
      dest_iata: s.dest_iata,
      airline: s.airline,
      deal_price: String(s.price),
      normal_price: String(s.baseline),
      validity_start: s.departure_date,
      validity_end: s.return_date ?? s.departure_date,
      source_url: s.source_url,
    }))
    searchPhotos(s.dest_city)
    setActiveTab('publish')
  }

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function selectOrigin(city: string, iata: string) {
    set('origin_city', city)
    set('origin_iata', iata)
  }

  function selectDest(city: string, iata: string) {
    set('dest_city', city)
    set('dest_iata', iata)
    setPhotoQuery(city)
    searchPhotos(city)
  }

  async function searchPhotos(query: string) {
    if (!PEXELS_KEY && !process.env.NEXT_PUBLIC_PEXELS_API_KEY) return
    const key = PEXELS_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' travel')}&per_page=6`, {
      headers: { Authorization: key! },
    })
    const data = await res.json()
    setPhotoResults(data.photos ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/admin/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': form.admin_secret,
      },
      body: JSON.stringify({
        origin_city: form.origin_city,
        origin_iata: form.origin_iata,
        dest_city: form.dest_city,
        dest_iata: form.dest_iata,
        airline: form.airline,
        normal_price: parseFloat(form.normal_price),
        deal_price: parseFloat(form.deal_price),
        currency: form.currency,
        validity_start: form.validity_start,
        validity_end: form.validity_end,
        source_url: form.source_url,
        image_url: form.image_url,
        curator_note: form.curator_note,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setMessage(`Deal published! ID: ${data.deal.id}`)
      setForm(prev => ({ ...prev, dest_city: '', dest_iata: '', airline: '', normal_price: '', deal_price: '', validity_start: '', validity_end: '', source_url: '', image_url: '', curator_note: '' }))
      setPhotoResults([])
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong')
    }
  }

  const discount = form.normal_price && form.deal_price
    ? Math.round(((parseFloat(form.normal_price) - parseFloat(form.deal_price)) / parseFloat(form.normal_price)) * 100)
    : null

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">✈️ Travelbaby Admin</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { id: 'candidates', label: '📥 Pipeline Queue' },
            { id: 'suggestions', label: '🔍 Deal Suggestions' },
            { id: 'publish', label: '📝 Publish Deal' },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as 'candidates' | 'suggestions' | 'publish')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pipeline Queue tab */}
        {activeTab === 'candidates' && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admin password</label>
                <input type="password" value={form.admin_secret} onChange={e => set('admin_secret', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Required" />
              </div>
              <button type="button" onClick={fetchCandidates} disabled={candidatesLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
                {candidatesLoading ? 'Loading...' : 'Load Queue'}
              </button>
            </div>

            {candidates.length === 0 && !candidatesLoading && (
              <div className="text-center py-10 text-gray-400 text-sm">
                <p className="text-2xl mb-2">📥</p>
                <p>No pending candidates. Run the pipeline scrapers to fill the queue.</p>
              </div>
            )}

            <div className="space-y-3">
              {candidates.map(c => {
                const SOURCE_COLORS: Record<string, string> = {
                  airline_scraper: 'bg-blue-100 text-blue-700',
                  telegram: 'bg-purple-100 text-purple-700',
                  newsletter: 'bg-green-100 text-green-700',
                }
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] ?? 'bg-gray-200 text-gray-700'}`}>
                            {c.source.replace('_', ' ')}
                          </span>
                          {c.origin_iata && c.dest_iata && (
                            <span className="text-sm font-bold text-gray-900">
                              {c.origin_iata} → {c.dest_iata}
                            </span>
                          )}
                          {c.airline && <span className="text-xs text-gray-500">{c.airline}</span>}
                          {c.price_inr && (
                            <span className="text-sm font-black text-green-700">
                              ₹{c.price_inr.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {c.travel_start && (
                          <p className="text-xs text-gray-400 mb-1">
                            {c.travel_start}{c.travel_end ? ` → ${c.travel_end}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">{c.raw_payload.slice(0, 160)}</p>
                        {c.raw_url && (
                          <a href={c.raw_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
                            {c.raw_url}
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button type="button" onClick={() => useCandidate(c)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">
                          Use this →
                        </button>
                        <button type="button" onClick={() => rejectCandidate(c.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-medium rounded-lg border border-gray-200">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Suggestions tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admin password</label>
                <input type="password" value={form.admin_secret} onChange={e => set('admin_secret', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Required to fetch" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">From</label>
                <select value={suggestionsOrigin} onChange={e => setSuggestionsOrigin(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {[{city:'Delhi',iata:'DEL'},{city:'Mumbai',iata:'BOM'},{city:'Bangalore',iata:'BLR'},{city:'Chennai',iata:'MAA'},{city:'Hyderabad',iata:'HYD'}].map(c => (
                    <option key={c.iata} value={c.iata}>{c.city}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => fetchSuggestions(suggestionsOrigin)}
                disabled={suggestionsLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
                {suggestionsLoading ? 'Scanning...' : 'Scan Deals'}
              </button>
            </div>

            {/* Trip type + stops filters */}
            <div className="flex flex-wrap gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Trip type</p>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                  {[{ label: 'Return', value: '1' }, { label: 'One-way', value: '2' }].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setTripType(opt.value as '1' | '2')}
                      className={`px-3 py-1.5 font-medium transition-colors ${tripType === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Max stops</p>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                  {[{ label: 'Direct only', value: '1' }, { label: 'Max 1 stop', value: '2' }].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setMaxStops(opt.value as '1' | '2')}
                      className={`px-3 py-1.5 font-medium transition-colors ${maxStops === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {suggestionsLoading && (
              <div className="text-center py-10 text-gray-400 text-sm">Scanning Google Flights for deals...</div>
            )}

            {suggestionsError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{suggestionsError}</div>
            )}

            {!suggestionsLoading && suggestions.length === 0 && !suggestionsError && (
              <div className="text-center py-10 text-gray-400 text-sm">
                Enter your password and click Scan Deals to find live flight deals.
              </div>
            )}

            <div className="space-y-3">
              {suggestions.map((s, i) => {
                const cfg = TIER_CONFIG[s.tier]
                return (
                  <div key={i} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                    {/* Warning for glitch fares */}
                    {s.warning && (
                      <div className="text-xs text-purple-700 bg-purple-100 rounded-lg px-3 py-1.5 mb-2 font-medium">
                        ⚠️ {s.warning}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-black ${cfg.text}`}>
                            {s.discount_pct > 0 ? `${s.discount_pct}% off` : 'No discount'}
                          </span>
                          <span className={`text-xs text-white px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {s.using_real_baseline && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              vs 30-day avg
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-900 text-sm mt-1">
                          {s.origin_city} → {s.dest_city} · {s.airline}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-800">₹{s.price.toLocaleString('en-IN')}</span>
                          <span>vs baseline ₹{s.baseline.toLocaleString('en-IN')}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.is_direct ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {s.is_direct ? 'Direct' : `${s.stops} stop`}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                            {s.trip_type === 'return' ? '⇄ Return' : '→ One-way'}
                          </span>
                          <span>{s.departure_date}{s.return_date ? ` → ${s.return_date}` : ''}</span>
                        </p>
                      </div>
                      <button type="button" onClick={() => useSuggestion(s)}
                        className="ml-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                        Use this →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Publish tab */}
        {activeTab === 'publish' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* Admin secret */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin password</label>
            <input type="password" value={form.admin_secret} onChange={e => set('admin_secret', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Origin city</label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <button type="button" key={c.iata}
                  onClick={() => selectOrigin(c.city, c.iata)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.origin_iata === c.iata ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
            <div className="flex flex-wrap gap-2">
              {DEST_CITIES.map(c => (
                <button type="button" key={c.iata}
                  onClick={() => selectDest(c.city, c.iata)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.dest_iata === c.iata ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {c.city}
                </button>
              ))}
            </div>
            <input placeholder="Or type city name" value={form.dest_city}
              onChange={e => { set('dest_city', e.target.value); setPhotoQuery(e.target.value) }}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="IATA code (e.g. BKK)" value={form.dest_iata}
              onChange={e => set('dest_iata', e.target.value.toUpperCase())}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Airline */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Airline</label>
            <select value={form.airline} onChange={e => set('airline', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select airline</option>
              {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Normal price (INR)</label>
              <input type="number" value={form.normal_price} onChange={e => set('normal_price', e.target.value)}
                placeholder="35000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deal price (INR)</label>
              <input type="number" value={form.deal_price} onChange={e => set('deal_price', e.target.value)}
                placeholder="18000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>

          {discount !== null && (
            <div className={`text-sm font-semibold rounded-lg px-3 py-2 ${discount >= 40 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {discount >= 40 ? `✅ ${discount}% discount — qualifies!` : `⚠️ ${discount}% discount — below the 40% threshold`}
            </div>
          )}

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valid from</label>
              <input type="date" value={form.validity_start} onChange={e => set('validity_start', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valid until</label>
              <input type="date" value={form.validity_end} onChange={e => set('validity_end', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Source URL</label>
            <input type="url" value={form.source_url} onChange={e => set('source_url', e.target.value)}
              placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Destination photo</label>
            {photoResults.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photoResults.map((p, i) => (
                  <button type="button" key={i} onClick={() => set('image_url', p.src.medium)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-colors ${form.image_url === p.src.medium ? 'border-blue-500' : 'border-transparent'}`}>
                    <img src={p.src.medium} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={photoQuery} onChange={e => setPhotoQuery(e.target.value)}
                placeholder="Search Pexels..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={() => searchPhotos(photoQuery)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Search</button>
            </div>
            <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              placeholder="Or paste image URL directly" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>

          {/* Curator note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Curator note</label>
            <textarea value={form.curator_note} onChange={e => set('curator_note', e.target.value)}
              rows={3} placeholder="Why this deal is worth booking, how to book, any conditions..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60">
            {status === 'loading' ? 'Publishing...' : 'Publish Deal'}
          </button>

          {message && (
            <p className={`text-sm text-center ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
          )}
        </form>
        )}
      </div>
    </main>
  )
}

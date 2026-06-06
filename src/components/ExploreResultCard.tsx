'use client'

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

const TIER_STYLES: Record<string, { bg: string; badge: string; label: string }> = {
  great:  { bg: 'from-green-500 to-emerald-600', badge: 'bg-green-500', label: '🔥 Great deal' },
  good:   { bg: 'from-blue-500 to-blue-600',     badge: 'bg-blue-500',  label: '👍 Good deal' },
  normal: { bg: 'from-gray-500 to-gray-600',     badge: 'bg-gray-400',  label: 'Market price' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function fmtPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function ExploreResultCard({ result }: { result: ExploreResult }) {
  const tier = TIER_STYLES[result.tier] ?? TIER_STYLES.normal

  return (
    <a
      href={result.google_flights_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden"
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${tier.bg} p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
              {result.origin_iata} → {result.dest_iata}
            </p>
            <h3 className="text-xl font-black mt-0.5">{result.dest_city}</h3>
            <p className="text-white/80 text-sm mt-0.5">{result.airline}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">{fmtPrice(result.price)}</p>
            {result.discount_pct > 0 && (
              <p className="text-white/80 text-sm line-through">{fmtPrice(result.baseline)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {result.discount_pct > 0 && (
              <span className={`text-xs text-white font-bold px-2 py-1 rounded-full ${tier.badge}`}>
                {result.discount_pct}% off · {tier.label}
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${result.is_direct ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {result.is_direct ? '✈ Direct' : `${result.stops} stop`}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {result.trip_type === 'return' ? '⇄ Return' : '→ One-way'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            {fmtDate(result.departure_date)}
            {result.return_date ? ` → ${fmtDate(result.return_date)}` : ''}
          </span>
          <span className="text-blue-600 font-semibold group-hover:underline text-xs">
            Search on Google Flights →
          </span>
        </div>
      </div>
    </a>
  )
}

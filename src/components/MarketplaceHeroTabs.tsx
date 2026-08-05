import Link from 'next/link'

const AUDIENCES = [
  {
    id: 'traveller',
    label: '✈️ Traveller',
    status: 'available',
  },
  {
    id: 'agent',
    label: '🏢 Travel Agent',
    status: 'coming-soon',
  },
  {
    id: 'creator',
    label: '🎥 Travel Creator',
    status: 'coming-soon',
  },
] as const

export default function MarketplaceHeroTabs() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 mb-5">
        {AUDIENCES.map((audience) => {
          const isAvailable = audience.status === 'available'

          return (
            <div
              key={audience.id}
              className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm sm:text-base font-bold border transition-colors ${
                isAvailable
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white/75 text-slate-500 border-white/70 cursor-not-allowed'
              }`}
              aria-disabled={!isAvailable}
            >
              <span>{audience.label}</span>
              {!isAvailable && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
                  Coming soon
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed mb-5 max-w-xl mx-auto">
        Get curated international flight deals from India, set personalised alerts, and book directly with airlines or trusted travel platforms.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/signup"
          className="bg-white hover:bg-blue-50 text-blue-700 shadow-md font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          Sign up to get alerts
        </Link>
        <Link
          href="/login"
          className="bg-transparent hover:bg-white/25 text-blue-800 border border-blue-700/50 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}

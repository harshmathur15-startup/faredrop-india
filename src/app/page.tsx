import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import DealCard from '@/components/DealCard'
import SignupForm from '@/components/SignupForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDeals(): Promise<Deal[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10)
    return data ?? []
  } catch {
    return []
  }
}

const METROS = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad']

export default async function Home() {
  const deals = await getDeals()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="font-black text-xl text-blue-600 tracking-tight">✈ FareDrop India</span>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            Explore
          </Link>
          <a href="#deals" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            Deals
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white px-4 pt-14 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          New deals added weekly
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight max-w-2xl mx-auto">
          Handpicked flight deals that<br />
          <span className="text-blue-600">save you 40% or more.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-lg mx-auto">
          We monitor fares from {METROS.join(', ')} and only alert you when prices drop significantly. No noise. Just deals worth booking.
        </p>

        {/* Signup */}
        <div className="mt-8 max-w-md mx-auto">
          <SignupForm />
          <p className="mt-2 text-xs text-gray-400">Free forever. No spam. Unsubscribe anytime.</p>
          <div className="mt-4">
            <Link href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors text-sm">
              🔍 Explore live prices yourself →
            </Link>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          {[
            { stat: '40%+', label: 'average discount' },
            { stat: '5 metros', label: 'covered' },
            { stat: 'Human', label: 'curation' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-gray-900">{stat}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deal feed */}
      <section id="deals" className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">
            {deals.length > 0 ? 'Live deals' : 'Deals coming soon'}
          </h2>
          {deals.length > 0 && (
            <span className="text-xs text-gray-400">{deals.length} deals found</span>
          )}
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-5xl mb-4">✈️</p>
            <p className="text-lg font-semibold text-gray-700">First deals landing soon</p>
            <p className="text-sm text-gray-400 mt-1">Sign up above to be the first to know.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 px-4 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-10">How FareDrop works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'We scan', desc: 'Hundreds of routes from Indian metros — every hour.' },
              { step: '02', title: 'We curate', desc: 'A human checks every deal before it reaches you.' },
              { step: '03', title: 'You book', desc: 'Get the deal in your inbox. Click. Book. Done.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <span className="text-4xl font-black text-blue-100">{step}</span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} FareDrop India · Curated for Indian travellers
      </footer>
    </main>
  )
}

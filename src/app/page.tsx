import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Link from 'next/link'
import SignupForm from '@/components/SignupForm'
import DealCarousel from '@/components/DealCarousel'
import BabyFalcon from '@/components/BabyFalcon'

export const dynamic = 'force-dynamic'

async function getDeals(): Promise<Deal[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12)
    return data ?? []
  } catch {
    return []
  }
}

const TESTIMONIALS = [
  { name: 'Priya S.', city: 'Delhi', dest: 'Bangkok', saving: '₹18,000', quote: "I almost missed it thinking it was a mistake fare. Booked immediately — best trip ever!", avatar: '👩' },
  { name: 'Rahul M.', city: 'Mumbai', dest: 'Tokyo', saving: '₹32,000', quote: "FareDrop sent me an alert at 7am. By 9am I had tickets. Japan trip sorted!", avatar: '👨' },
  { name: 'Anjali K.', city: 'Bangalore', dest: 'London', saving: '₹41,000', quote: "I'd been eyeing London for 2 years. Got 55% off. This service is unreal.", avatar: '👩‍💼' },
]

const METROS = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad']

export default async function Home() {
  const deals = await getDeals()

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Nav ── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦅</span>
          <span className="font-black text-xl text-blue-900 tracking-tight">FareDrop <span className="text-amber-500">India</span></span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">
            Explore prices
          </Link>
          <a href="#deals" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">
            Deals
          </a>
          <a href="#signup"
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            Get free alerts
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white px-5 pt-16 pb-20 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* Left — copy + form */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-amber-400/30">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                New deals added weekly
              </div>

              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                Handpicked flight deals.<br />
                <span className="text-amber-400">40%+ off.</span><br />
                In your inbox.
              </h1>

              <p className="text-blue-200 text-lg mb-8 max-w-md">
                We scan thousands of fares from {METROS.join(', ')} and only alert you when prices drop significantly. No noise. Just deals worth booking.
              </p>

              {/* Signup form */}
              <div id="signup" className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
                <p className="text-sm font-semibold text-white mb-3">Get deal alerts — free forever</p>
                <SignupForm />
                <p className="text-blue-300 text-xs mt-2">No spam. Unsubscribe anytime. Deals from {METROS.length} Indian metros.</p>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-5 mt-6 text-sm text-blue-200">
                <span>✓ Only direct & 1-stop flights</span>
                <span>✓ Min 40% savings</span>
                <span>✓ All prices in INR</span>
              </div>
            </div>

            {/* Right — Baby Falcon */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <BabyFalcon size={220} showBubble={true} />
                {/* Floating deal badges */}
                <div className="absolute -top-2 -left-8 bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  68% OFF ✈
                </div>
                <div className="absolute top-16 -right-6 bg-amber-400 text-blue-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg" style={{animation: 'bounce 2s infinite 0.5s'}}>
                  ₹15,850
                </div>
                <div className="absolute bottom-16 -left-6 bg-purple-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg" style={{animation: 'bounce 2s infinite 1s'}}>
                  Tokyo 51% off
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promise bar ── */}
      <div className="bg-amber-500 text-blue-900 py-3 px-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm font-bold">
          <span>✈ Direct & 1-stop flights only</span>
          <span>•</span>
          <span>💰 Every deal saves 40%+</span>
          <span>•</span>
          <span>🧳 Luggage usually included</span>
          <span>•</span>
          <span>🇮🇳 5 Indian metros covered</span>
        </div>
      </div>

      {/* ── Deals ── */}
      <section id="deals" className="max-w-5xl mx-auto px-5 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {deals.length > 0 ? '🔥 Live deals' : '🦅 Deals coming soon'}
            </h2>
            <p className="text-gray-500 mt-1">
              {deals.length > 0 ? `${deals.length} handpicked deals live now` : 'Our falcon is hunting. Sign up to be first.'}
            </p>
          </div>
          {deals.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              Sorted by best saving
            </span>
          )}
        </div>
        <DealCarousel deals={deals} />
      </section>

      {/* ── Explore strip ── */}
      <section className="bg-blue-900 text-white py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <BabyFalcon size={80} showBubble={false} />
            <div>
              <h3 className="text-xl font-black">Want to search prices yourself?</h3>
              <p className="text-blue-300 text-sm mt-1">Filter by city, region, month and budget. Live prices.</p>
            </div>
          </div>
          <Link href="/explore"
            className="bg-amber-400 hover:bg-amber-300 text-blue-900 font-black px-6 py-3 rounded-xl transition-colors text-sm shrink-0">
            Explore live prices →
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">How FareDrop works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { emoji: '🔍', step: '01', title: 'We scan', desc: 'Our baby falcon scans hundreds of routes from Indian metros every single day.' },
            { emoji: '✅', step: '02', title: 'We verify', desc: 'A human checks every deal. Only 40%+ discounts with real availability make the cut.' },
            { emoji: '📩', step: '03', title: 'You book', desc: 'Get the deal in your inbox. Click. Book directly with the airline. Done.' },
          ].map(({ emoji, step, title, desc }) => (
            <div key={step} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="text-5xl mb-3">{emoji}</div>
              <div className="text-4xl font-black text-blue-100 mb-1">{step}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-14 px-5 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-10">Travellers who saved big</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-2xl">{t.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.city} → {t.dest}</p>
                  </div>
                  <div className="ml-auto bg-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-full">
                    Saved {t.saving}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-16 px-5">
        <div className="max-w-lg mx-auto text-center">
          <BabyFalcon size={100} showBubble={false} />
          <h2 className="text-3xl font-black mt-4 mb-3">Never miss a deal again</h2>
          <p className="text-blue-200 mb-6">Free alerts. No spam. Just flights worth booking.</p>
          <SignupForm />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 px-5 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🦅</span>
              <span className="font-black text-white">FareDrop India</span>
            </div>
            <p className="text-sm text-blue-400">Curated flight deals for Indian travellers</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <a href="#deals" className="hover:text-white transition-colors">Deals</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </div>
          <p className="text-xs text-blue-500">© {new Date().getFullYear()} FareDrop India</p>
        </div>
      </footer>

    </main>
  )
}

import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
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

const STATS = [
  { value: '₹2.4 Cr+', label: 'saved by travellers' },
  { value: '1,200+', label: 'subscribers' },
  { value: '40–90%', label: 'average discount' },
  { value: '5 metros', label: 'covered' },
]

const AIRLINES = [
  { name: 'IndiGo', emoji: '✈️' },
  { name: 'Air India', emoji: '🇮🇳' },
  { name: 'Emirates', emoji: '🇦🇪' },
  { name: 'Qatar Airways', emoji: '🇶🇦' },
  { name: 'Singapore Airlines', emoji: '🇸🇬' },
  { name: 'Thai Airways', emoji: '🇹🇭' },
  { name: 'Etihad', emoji: '🕌' },
  { name: 'SpiceJet', emoji: '🌶️' },
]

const DESTINATIONS = [
  { city: 'Bangkok', country: 'Thailand', emoji: '🇹🇭', from: '₹14,999', gradient: 'from-orange-400 to-pink-500', iata: 'BKK' },
  { city: 'Singapore', country: 'Singapore', emoji: '🇸🇬', from: '₹18,500', gradient: 'from-red-500 to-rose-600', iata: 'SIN' },
  { city: 'Dubai', country: 'UAE', emoji: '🇦🇪', from: '₹12,800', gradient: 'from-amber-400 to-orange-500', iata: 'DXB' },
  { city: 'Bali', country: 'Indonesia', emoji: '🇮🇩', from: '₹22,000', gradient: 'from-green-400 to-teal-500', iata: 'DPS' },
  { city: 'Tokyo', country: 'Japan', emoji: '🇯🇵', from: '₹38,000', gradient: 'from-pink-400 to-purple-500', iata: 'NRT' },
  { city: 'London', country: 'UK', emoji: '🇬🇧', from: '₹42,000', gradient: 'from-blue-500 to-indigo-600', iata: 'LHR' },
  { city: 'Paris', country: 'France', emoji: '🇫🇷', from: '₹44,000', gradient: 'from-purple-400 to-pink-500', iata: 'CDG' },
  { city: 'Male', country: 'Maldives', emoji: '🇲🇻', from: '₹16,000', gradient: 'from-cyan-400 to-blue-500', iata: 'MLE' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', city: 'Delhi', dest: 'Bangkok', saving: '₹18,000', quote: 'I almost missed it thinking it was a mistake fare. Booked immediately — best trip ever!', avatar: '👩', discount: '58%' },
  { name: 'Rahul M.', city: 'Mumbai', dest: 'Tokyo', saving: '₹32,000', quote: 'FareDrop sent me an alert at 7am. By 9am I had tickets. Japan trip sorted!', avatar: '👨', discount: '51%' },
  { name: 'Anjali K.', city: 'Bangalore', dest: 'London', saving: '₹41,000', quote: "I'd been eyeing London for 2 years. Got 55% off. This service is unreal.", avatar: '👩‍💼', discount: '55%' },
]

const METROS = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad']

export default async function Home() {
  const deals = await getDeals()

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Nav ── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/travel-baby-logo.png" alt="Travel Baby" width={50} height={50} className="h-12 w-auto" />
          <span className="font-black text-xl text-blue-900 tracking-tight">FareDrop <span className="text-amber-500">India</span></span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Explore prices</Link>
          <a href="#deals" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Deals</a>
          <a href="#signup" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Get free alerts</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white px-5 pt-14 pb-16 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-amber-400/30">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                New deals added weekly
              </div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                Handpicked flight deals.<br />
                <span className="text-amber-400">40–90% off.</span><br />
                In your inbox.
              </h1>
              <p className="text-blue-200 text-lg mb-8 max-w-md leading-relaxed">
                We scan thousands of fares from {METROS.join(', ')} daily and only alert you when prices drop significantly.
              </p>
              <div id="signup" className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
                <p className="text-sm font-semibold text-white mb-3">✈ Get deal alerts — free forever</p>
                <SignupForm />
                <p className="text-blue-300 text-xs mt-2">No spam · Unsubscribe anytime · {METROS.length} Indian metros</p>
              </div>
            </div>

            {/* Falcon + floating badges */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <BabyFalcon size={220} showBubble={true} />
                <div className="absolute -top-2 -left-10 bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-bounce">68% OFF ✈</div>
                <div className="absolute top-14 -right-8 bg-amber-400 text-blue-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg">₹15,850 🔥</div>
                <div className="absolute bottom-20 -left-8 bg-purple-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">Tokyo 51% off</div>
                <div className="absolute bottom-4 -right-6 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">London ₹42K</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── (moved to top) */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-2">How FareDrop works</h2>
        <p className="text-center text-gray-500 mb-10">Three simple steps between you and an incredible trip</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: '🔍', step: '01', title: 'We scan', desc: 'Our baby falcon scans hundreds of routes from Indian metros every single day — 24/7.' },
            { emoji: '✅', step: '02', title: 'We verify', desc: 'A human checks every deal. Only 40%+ discounts with real seat availability make the cut.' },
            { emoji: '📩', step: '03', title: 'You book', desc: 'Get the deal in your inbox. One click. Book directly with the airline. No middlemen.' },
          ].map(({ emoji, step, title, desc }) => (
            <div key={step} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-3 right-4 text-6xl font-black text-blue-50 select-none">{step}</div>
              <div className="text-5xl mb-4">{emoji}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="bg-amber-500 text-blue-900 py-4 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs font-semibold opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promise bar ── */}
      <div className="bg-blue-950 text-blue-300 py-3 px-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-semibold">
          <span>✈ Direct & 1-stop flights only</span>
          <span className="hidden sm:block">·</span>
          <span>💰 Every deal saves 40%+</span>
          <span className="hidden sm:block">·</span>
          <span>🧳 Luggage usually included</span>
          <span className="hidden sm:block">·</span>
          <span>🇮🇳 5 Indian metros covered</span>
          <span className="hidden sm:block">·</span>
          <span>✅ Human-verified deals only</span>
        </div>
      </div>

      {/* ── Airline logos strip ── */}
      <div className="bg-white border-b border-gray-100 py-6 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">We track deals from these airlines</p>
          <div className="flex flex-wrap justify-center gap-3">
            {AIRLINES.map(a => (
              <div key={a.name} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold text-gray-700">
                <span>{a.emoji}</span>
                <span>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Deals ── */}
      <section id="deals" className="max-w-5xl mx-auto px-5 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {deals.length > 0 ? '🔥 Live deals' : '🦅 Deals dropping soon'}
            </h2>
            <p className="text-gray-500 mt-1">
              {deals.length > 0 ? `${deals.length} handpicked deals live now` : 'Sign up above — our falcon is hunting right now'}
            </p>
          </div>
          {deals.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium hidden sm:block">Sorted by best saving</span>
          )}
        </div>
        <DealCarousel deals={deals} />
      </section>

      {/* ── Popular Destinations ── */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Popular destinations from India</h2>
            <p className="text-gray-500 text-sm mt-1">Baseline fares — deals go much lower</p>
          </div>
          <Link href="/explore" className="text-sm font-bold text-blue-600 hover:underline hidden sm:block">Search all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DESTINATIONS.map(d => (
            <Link key={d.iata} href="/explore"
              className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`bg-gradient-to-br ${d.gradient} p-6 h-36 flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{d.emoji}</span>
                  <span className="text-white/80 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{d.country}</span>
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{d.city}</p>
                  <p className="text-white/80 text-xs mt-0.5">From <span className="font-bold text-white">{d.from}</span></p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
            </Link>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          Deals can be <span className="font-bold text-green-600">40–90% below</span> these baseline prices ·
          <Link href="/explore" className="text-blue-600 font-semibold hover:underline ml-1">Search live prices →</Link>
        </p>
      </section>

      {/* ── Explore strip ── */}
      <section className="bg-blue-900 text-white py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <BabyFalcon size={80} showBubble={false} />
            <div>
              <h3 className="text-xl font-black">Want to search prices yourself?</h3>
              <p className="text-blue-300 text-sm mt-1">Filter by city, region, month and budget. Live prices updated daily.</p>
            </div>
          </div>
          <Link href="/explore" className="bg-amber-400 hover:bg-amber-300 text-blue-900 font-black px-6 py-3 rounded-xl transition-colors text-sm shrink-0">
            Explore live prices →
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-14 px-5 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-2">Real savings. Real travellers.</h2>
          <p className="text-center text-gray-500 mb-10">Join 1,200+ Indians who never pay full price for flights</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-2xl">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.city} → {t.dest}</p>
                    </div>
                  </div>
                  <div className="bg-green-500 text-white text-xs font-black px-2.5 py-1 rounded-full shrink-0">{t.discount} off</div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic mb-3">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
                  <span className="text-xs text-gray-400 ml-1">Saved {t.saving}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ strip ── */}
      <section className="max-w-3xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Common questions</h2>
        <div className="space-y-4">
          {[
            { q: 'Is FareDrop India free?', a: 'Yes, completely free. We curate deals and earn a small affiliate commission when you book — you pay nothing extra.' },
            { q: 'Which cities do you cover?', a: 'Currently Delhi, Mumbai, Bangalore, Chennai and Hyderabad. More metros coming soon.' },
            { q: 'How are deals verified?', a: 'Every deal is manually checked by a human before it reaches you. We verify the fare is live, seats are available, and the discount is real.' },
            { q: 'Do deals include checked luggage?', a: 'Most of our deals include at least 1 checked bag. We mention luggage details in each deal alert.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-bold text-gray-900 mb-1.5">🦅 {q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 px-5">
        <div className="max-w-lg mx-auto text-center">
          <BabyFalcon size={110} showBubble={false} />
          <h2 className="text-3xl font-black mt-4 mb-2">Never miss a deal again</h2>
          <p className="text-blue-200 mb-6 text-lg">Free alerts. No spam. Just flights worth booking.</p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <SignupForm />
          </div>
          <p className="text-blue-400 text-xs mt-3">Join 1,200+ travellers already saving big</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 px-5 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/travel-baby-logo.png" alt="Travel Baby" width={40} height={40} className="h-10 w-auto" />
                <span className="font-black text-white text-lg">FareDrop India</span>
              </div>
              <p className="text-sm text-blue-400 max-w-xs">Curated international flight deals for Indian travellers. Only the best. Only the verified.</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2">
                <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Product</p>
                <Link href="/explore" className="block hover:text-white transition-colors">Explore prices</Link>
                <a href="#deals" className="block hover:text-white transition-colors">Live deals</a>
                <a href="#how-it-works" className="block hover:text-white transition-colors">How it works</a>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Cities</p>
                {METROS.map(m => <p key={m} className="text-sm">{m}</p>)}
              </div>
            </div>
          </div>
          <div className="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-blue-500">© {new Date().getFullYear()} FareDrop India · Curated for Indian travellers</p>
            <p className="text-xs text-blue-600">Prices shown are indicative. Always verify before booking.</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

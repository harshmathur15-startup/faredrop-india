import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import SignupForm from '@/components/SignupForm'
import MobileMenu from '@/components/MobileMenu'
import NavAuth from '@/components/NavAuth'
import NavLinks from '@/components/NavLinks'
import HeroDeals from '@/components/HeroDeals'
import DealsSection from '@/components/DealsSection'

export const dynamic = 'force-dynamic'

async function getDeals(): Promise<Deal[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

const STATS = [
  { value: '₹20 lakhs +', label: 'saved by travellers' },
  { value: '200+', label: 'subscribers' },
  { value: '40–90%', label: 'average discount' },
  { value: '5 Indian metros', label: 'covered' },
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
  { city: 'Singapore', country: 'Singapore', emoji: '🇸🇬', normal: '₹42,000', from: '₹24,999', discount: '40%', gradient: 'from-red-500 to-rose-600', iata: 'SIN' },
  { city: 'Dubai', country: 'UAE', emoji: '🇦🇪', normal: '₹28,000', from: '₹15,999', discount: '43%', gradient: 'from-amber-400 to-orange-500', iata: 'DXB' },
  { city: 'Bali', country: 'Indonesia', emoji: '🇮🇩', normal: '₹45,000', from: '₹24,999', discount: '44%', gradient: 'from-green-400 to-teal-500', iata: 'DPS' },
  { city: 'Tokyo', country: 'Japan', emoji: '🇯🇵', normal: '₹85,000', from: '₹42,000', discount: '51%', gradient: 'from-pink-400 to-purple-500', iata: 'NRT' },
  { city: 'London', country: 'UK', emoji: '🇬🇧', normal: '₹95,000', from: '₹48,000', discount: '49%', gradient: 'from-blue-500 to-indigo-600', iata: 'LHR' },
  { city: 'Paris', country: 'France', emoji: '🇫🇷', normal: '₹90,000', from: '₹46,000', discount: '49%', gradient: 'from-purple-400 to-pink-500', iata: 'CDG' },
  { city: 'Male', country: 'Maldives', emoji: '🇲🇻', normal: '₹38,000', from: '₹19,999', discount: '47%', gradient: 'from-cyan-400 to-blue-500', iata: 'MLE' },
  { city: 'Kuala Lumpur', country: 'Malaysia', emoji: '🇲🇾', normal: '₹22,000', from: '₹11,999', discount: '45%', gradient: 'from-blue-500 to-teal-600', iata: 'KUL' },
]


const TESTIMONIALS = [
  { name: 'Priya S.', city: 'Delhi', dest: 'Singapore', saving: '₹17,000', quote: 'I almost missed it thinking it was a mistake fare. Booked immediately — best trip ever!', avatar: '👩', discount: '41%' },
  { name: 'Rahul M.', city: 'Mumbai', dest: 'Tokyo', saving: '₹32,000', quote: 'Travelbaby sent me an alert at 7am. By 9am I had tickets. Japan trip sorted!', avatar: '👨', discount: '51%' },
  { name: 'Anjali K.', city: 'Bangalore', dest: 'London', saving: '₹41,000', quote: "I'd been eyeing London for 2 years. Got 55% off. This service is unreal.", avatar: '👩‍💼', discount: '55%' },
]

const METROS = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad']

export default async function Home() {
  const deals = await getDeals()
  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Nav ── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-12 w-auto drop-shadow" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </div>
        <div className="flex items-center gap-5">
          <NavLinks />
          <div className="hidden sm:block"><NavAuth /></div>
          <MobileMenu />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative px-5 pt-20 pb-0 overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&q=85')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Sky-blue tinted overlay — keeps the airplane photo but gives it a clear sky-blue tone (still readable white text) */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(56,189,248,0.55) 0%, rgba(2,132,199,0.62) 45%, rgba(12,74,110,0.80) 100%)' }}
        />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-3xl mx-auto text-center">

          {/* Social proof pill */}
          <div className="inline-flex items-center gap-2 bg-white/85 text-slate-900 text-sm font-semibold px-4 py-1.5 rounded-full mb-7 border border-white/60 backdrop-blur-sm shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            200+ Indian travellers already saving big
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] text-slate-900 mb-5">
            Save up to{' '}
            <span className="text-blue-700">90% on flights</span>{' '}
            from India
          </h1>

          {/* Subheadline */}
          <p className="text-slate-800 text-lg sm:text-xl font-medium leading-relaxed mb-9 max-w-xl mx-auto">
            Get instant email alerts for real return flight deals from Delhi, Mumbai, Bangalore, Chennai &amp; Hyderabad — before they disappear.
          </p>

          {/* Signup form */}
          <div id="signup" className="max-w-xl mx-auto mb-5">
            <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white/8 border border-white/12 p-2 backdrop-blur-sm">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 text-white text-base outline-none bg-transparent placeholder-slate-500"
              />
              <a
                href="#signup-full"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-7 py-4 rounded-xl transition-colors text-base whitespace-nowrap text-center"
              >
                Join for free →
              </a>
            </div>
          </div>

          {/* Microcopy */}
          <p className="text-slate-500 text-sm mb-14">
            No credit card · No spam · Unsubscribe anytime
          </p>

          <HeroDeals deals={deals} />
        </div>
      </section>

      {/* ── Live Deals ── */}
      <DealsSection deals={deals} />

      {/* ── Full signup form (anchor target) ── */}
      <div id="signup-full" className="bg-gray-50 border-b border-gray-200 px-5 py-12">
        <div className="max-w-lg mx-auto text-center">
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Get free flight deal alerts</h3>
          <p className="text-gray-500 text-sm mb-6">Your first deal could save you ₹20,000+</p>
          <SignupForm />
          <p className="text-gray-400 text-xs mt-4">No credit card needed · Human-verified deals · Only real discounts</p>
        </div>
      </div>

      {/* ── What we do ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-3">What Travelbaby does</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">We constantly monitor fares from Indian airports for significant price drops, mistake fares, and rare discounts</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'We monitor constantly',
                desc: 'Our systems track 100+ international routes from Delhi, Mumbai, Bangalore, Chennai, and Hyderabad 24/7, looking for fares that drop 40%+ from baseline.'
              },
              {
                icon: '✋',
                title: 'We hand-pick the best',
                desc: 'Our team filters out complex itineraries, long layovers, self-transfers, and routes requiring visas. Only easy-to-book, high-quality deals make the cut.'
              },
              {
                icon: '📬',
                title: 'We alert you instantly',
                desc: 'As soon as a deal goes live, you get an email alert. Click through to book directly with airlines or OTAs. We are not a booking platform - we find deals for you.'
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100">
                <p className="text-5xl mb-4">{icon}</p>
                <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-3">Your 3-step process</h2>
          <p className="text-center text-gray-500 mb-16">Get deal alerts and book in minutes</p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">①</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Sign up (free)</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Create your account and set your home airport. No credit card required.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">②</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Receive deal alerts</h3>
                <p className="text-gray-600 text-lg leading-relaxed">We monitor fares 24/7 and send you email alerts as soon as a high-quality deal matching your interests drops.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">③</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Book directly</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Click the link in your alert and book directly through Google Flights, airlines, or OTAs. We don't charge any booking fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Travelbaby ── */}
      <section className="bg-blue-50 px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-12">Why Travelbaby?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: '⏰',
                title: 'Save time',
                desc: 'We do all the searching. You get curated deals without spending hours on flight comparison sites.'
              },
              {
                emoji: '💰',
                title: 'Save money',
                desc: 'Average savings of 40–90% on international flights. Every deal is verified before you see it.'
              },
              {
                emoji: '✈️',
                title: 'Travel better',
                desc: 'Tailored for Indian travelers. We focus on easy-to-book routes without visa complications or transit hassles.'
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-blue-100">
                <p className="text-4xl mb-3">{emoji}</p>
                <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats & Promise Combined ── */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 pb-8 border-b border-blue-800">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mb-1">{s.value}</p>
                <p className="text-xs font-semibold text-blue-300">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-blue-200">
            <span className="flex items-center gap-1">✈ Direct & 1-stop only</span>
            <span className="hidden sm:block text-blue-700">|</span>
            <span className="flex items-center gap-1">💰 40%+ off guaranteed</span>
            <span className="hidden sm:block text-blue-700">|</span>
            <span className="flex items-center gap-1">✅ Human-verified</span>
            <span className="hidden sm:block text-blue-700">|</span>
            <span className="flex items-center gap-1">🇮🇳 5 metros covered</span>
          </div>
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

      {/* ── Popular Destinations ── */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Popular destinations from India</h2>
            <p className="text-gray-500 text-sm mt-1">Baseline fares — deals go much lower</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DESTINATIONS.map(d => (
            <a key={d.iata} href="#deals"
              className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`bg-gradient-to-br ${d.gradient} p-5 h-40 flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{d.emoji}</span>
                  <span className="bg-black/30 backdrop-blur-sm text-white text-xs font-black px-2 py-0.5 rounded-full">
                    {d.discount} off
                  </span>
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{d.city}</p>
                  <p className="text-white/60 text-xs line-through mt-0.5">{d.normal}</p>
                  <p className="text-white text-sm font-bold">from {d.from}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
            </a>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          Deals can be <span className="font-bold text-green-600">40–90% below</span> these baseline prices ·
          <a href="#deals" className="text-blue-600 font-semibold hover:underline ml-1">See live deals →</a>
        </p>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-14 px-5 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-2">Real savings. Real travellers.</h2>
          <p className="text-center text-gray-500 mb-10">Join 200+ Indians who never pay full price for flights</p>
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
        <h2 className="font-display text-2xl font-bold text-slate-900 text-center mb-8">Common questions</h2>
        <div className="space-y-4">
          {[
            { q: 'Is Travelbaby India free?', a: 'We have a completely free tier plan with basic email alerts and limited deals. If you wish to receive all deals and real-time notifications, we have a nominal subscription price which you will recover in no time!' },
            { q: 'Which cities do you cover?', a: 'Currently Delhi, Mumbai, Bangalore, Chennai and Hyderabad. More metros coming soon.' },
            { q: 'How are deals verified?', a: 'Every deal is manually checked by a human before it reaches you. We verify the fare is live, seats are available, and the discount is real.' },
            { q: 'Do deals include checked luggage?', a: 'Most of our deals include at least 1 checked bag. We mention luggage details in each deal alert.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-bold text-gray-900 mb-1.5 flex items-center gap-2"><Image src="/travel-baby-logo.png" alt="" width={20} height={20} className="h-5 w-auto" /> {q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 px-5">
        <div className="max-w-lg mx-auto text-center">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={130} height={130} className="h-32 w-auto drop-shadow-lg mx-auto" />
          <h2 className="text-3xl font-black mt-4 mb-2">Never miss a deal again</h2>
          <p className="text-blue-200 mb-6 text-lg">Free alerts. No spam. Just flights worth booking.</p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <SignupForm />
          </div>
          <p className="text-blue-400 text-xs mt-3">Join 200+ travellers already saving big</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 px-5 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/travel-baby-logo.png" alt="Travelbaby" width={35} height={35} className="h-9 w-auto drop-shadow" />
                <span className="font-black text-white text-lg">Travelbaby</span>
              </div>
              <p className="text-sm text-blue-400 max-w-xs">Curated international flight deals for Indian travellers. Only the best. Only the verified.</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2">
                <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Product</p>
                <a href="#deals" className="block hover:text-white transition-colors">Live deals</a>
                <a href="#how-it-works" className="block hover:text-white transition-colors">How it works</a>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Cities</p>
                {METROS.map(m => <p key={m} className="text-sm">{m}</p>)}
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Company</p>
                <Link href="/about" className="block hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="block hover:text-white transition-colors">Contact us</Link>
                <Link href="/signup" className="block hover:text-white transition-colors">Login / Sign up</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-blue-500">© {new Date().getFullYear()} Travelbaby India · Curated for Indian travellers</p>
            <p className="text-xs text-blue-600">Prices shown are indicative. Always verify before booking.</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

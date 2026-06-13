import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import SignupForm from '@/components/SignupForm'
import DealCarousel from '@/components/DealCarousel'

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
        <div className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="FareDrop" width={45} height={45} className="h-12 w-auto drop-shadow" />
          <span className="font-black text-lg text-blue-900 tracking-tight">FareDrop</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Explore prices</Link>
          <a href="#deals" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Deals</a>
          <a href="#signup" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Get free alerts</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-white px-5 pt-12 pb-8 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-green-200">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                1,200+ people already saving
              </div>
              <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-5 text-gray-900">
                Stop overpaying<br />
                for flights.
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-md leading-relaxed font-medium">
                We find <span className="text-green-600 font-bold">40–90% cheaper flights</span> and send them directly to your inbox. No hidden fees. No middlemen. Just real deals.
              </p>
            </div>

            {/* Right: Mascot - clean, no background */}
            <div className="flex justify-center md:justify-end">
              <Image
                src="/travel-baby-logo.png"
                alt="FareDrop"
                width={280}
                height={280}
                className="drop-shadow-xl"
              />
            </div>
          </div>

          {/* Signup box - moved below and made more user-friendly */}
          <div id="signup" className="mt-12 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 shadow-lg">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">⏰ Limited-time offer</p>
                <h3 className="text-2xl font-black text-gray-900">Get free deal alerts</h3>
                <p className="text-gray-600 text-sm mt-2">First deal could save you ₹20,000+</p>
              </div>
              <SignupForm />
              <p className="text-gray-500 text-xs text-center mt-4">No credit card needed · Unsubscribe anytime · Only quality deals</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What we do ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-3">What FareDrop does</h2>
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
          <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Your 3-step process</h2>
          <p className="text-center text-gray-500 mb-16">Get deal alerts and book in minutes</p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">①</span>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Sign up (free)</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Create your account and set your home airport. No credit card required.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">②</span>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Receive deal alerts</h3>
                <p className="text-gray-600 text-lg leading-relaxed">We monitor fares 24/7 and send you email alerts as soon as a high-quality deal matching your interests drops.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <span className="w-14 h-14 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">③</span>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Book directly</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Click the link in your alert and book directly through Google Flights, airlines, or OTAs. We don't charge any booking fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why FareDrop ── */}
      <section className="bg-blue-50 px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Why FareDrop?</h2>

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

      {/* ── Pricing Plans ── */}
      <section className="bg-white px-5 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Choose your membership</h2>
          <p className="text-center text-gray-500 mb-12">Start free. Upgrade anytime.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 flex flex-col">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 text-sm mb-6">Limited deals, economy only</p>
              <p className="text-3xl font-black text-gray-900 mb-8">₹0</p>

              <ul className="space-y-3 mb-10 flex-grow">
                <li className="flex gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 font-black text-lg">✓</span>
                  <span>Deal alerts via email</span>
                </li>
                <li className="flex gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 font-black text-lg">✓</span>
                  <span>Economy-class only</span>
                </li>
                <li className="flex gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 font-black text-lg">✓</span>
                  <span>Limited deal selection</span>
                </li>
                <li className="flex gap-3 text-gray-400 text-sm">
                  <span className="text-gray-400 font-black text-lg">✗</span>
                  <span>Business/First class</span>
                </li>
                <li className="flex gap-3 text-gray-400 text-sm">
                  <span className="text-gray-400 font-black text-lg">✗</span>
                  <span>Real-time alerts</span>
                </li>
                <li className="flex gap-3 text-gray-400 text-sm">
                  <span className="text-gray-400 font-black text-lg">✗</span>
                  <span>Concierge support</span>
                </li>
              </ul>

              <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors">
                Get started free
              </button>
            </div>

            {/* Silver Plan */}
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl p-8 border-2 border-slate-500 flex flex-col">
              <h3 className="text-2xl font-black text-white mb-2">Silver</h3>
              <p className="text-slate-200 text-sm mb-6">Real-time deals, all classes</p>

              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-black text-white">₹399</p>
                  <p className="text-lg text-slate-300 line-through">₹499</p>
                </div>
                <p className="text-slate-300 text-xs">per month</p>
                <p className="text-slate-200 text-xs mt-3">or</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-black text-white">₹1,299</p>
                  <p className="text-sm text-slate-300 line-through">₹2,499</p>
                </div>
                <p className="text-slate-300 text-xs">per year (save 48%)</p>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                <li className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  <span>Everything in Free, plus:</span>
                </li>
                <li className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  <span>Real-time deal alerts</span>
                </li>
                <li className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  <span>Business & First class deals</span>
                </li>
                <li className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  <span>All international routes</span>
                </li>
                <li className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  <span>Mistake fares & rare finds</span>
                </li>
                <li className="flex gap-3 text-slate-300 text-sm">
                  <span className="text-slate-400 font-black text-lg">✗</span>
                  <span>Concierge support</span>
                </li>
              </ul>

              <button className="w-full bg-white hover:bg-gray-100 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                Start 7-day free trial
              </button>
            </div>

            {/* Gold Plan - Premium */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 border-2 border-amber-300 relative shadow-xl flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-black text-amber-900 mb-2">Gold</h3>
              <p className="text-amber-800 text-sm mb-6">Premium access + concierge</p>

              <div className="mb-8">
                <p className="text-amber-800 text-xs font-bold mb-3">ANNUAL ONLY</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-amber-900">₹9,999</p>
                  <p className="text-lg text-amber-700 line-through">₹14,999</p>
                </div>
                <p className="text-amber-800 text-xs mt-1">(Save 33%)</p>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                <li className="flex gap-3 text-amber-900 text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>Everything in Silver, plus:</span>
                </li>
                <li className="flex gap-3 text-amber-900 font-semibold text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>2 Concierge calls/month</span>
                </li>
                <li className="flex gap-3 text-amber-900 font-semibold text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>Personal booking assistance</span>
                </li>
                <li className="flex gap-3 text-amber-900 text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>Priority deal notifications</span>
                </li>
                <li className="flex gap-3 text-amber-900 text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>Exclusive error/hack fares</span>
                </li>
                <li className="flex gap-3 text-amber-900 text-sm">
                  <span className="font-black text-lg">✓</span>
                  <span>VIP email support</span>
                </li>
              </ul>

              <button className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors">
                Upgrade to Gold
              </button>
              <p className="text-center text-amber-800 text-xs mt-3">Best value for frequent travelers</p>
            </div>
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
            <Image src="/travel-baby-logo.png" alt="FareDrop" width={100} height={100} className="h-24 w-auto drop-shadow" />
            <div className="flex-1">
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
              <p className="font-bold text-gray-900 mb-1.5 flex items-center gap-2"><Image src="/travel-baby-logo.png" alt="" width={20} height={20} className="h-5 w-auto" /> {q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 px-5">
        <div className="max-w-lg mx-auto text-center">
          <Image src="/travel-baby-logo.png" alt="FareDrop" width={130} height={130} className="h-32 w-auto drop-shadow-lg mx-auto" />
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
                <Image src="/travel-baby-logo.png" alt="FareDrop" width={35} height={35} className="h-9 w-auto drop-shadow" />
                <span className="font-black text-white text-lg">FareDrop</span>
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

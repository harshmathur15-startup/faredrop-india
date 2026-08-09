import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import MobileMenu from '@/components/MobileMenu'
import NavAuth from '@/components/NavAuth'
import NavLinks from '@/components/NavLinks'
import HeroDeals from '@/components/HeroDeals'
import DealsSection from '@/components/DealsSection'
import { HomeCTAButtons, FooterAuthLink } from '@/components/HomeCTAAuth'

export const dynamic = 'force-dynamic'

async function getDeals(): Promise<Deal[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
    const { data } = await supabase
      .from('deals')
      .select('id, origin_iata, dest_iata, origin_city, dest_city, airline, normal_price, deal_price, currency, validity_start, validity_end, source_url, image_url, status, published_at, curator_note, created_at, is_premium')
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
  { value: 'Up to 90%', label: 'off on top deals' },
  { value: '5 Indian metros', label: 'covered' },
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
        className="relative px-5 pt-8 pb-0 overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&q=85')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Sky-blue tinted overlay — keeps the airplane photo but gives it a clear sky-blue tone (still readable white text) */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(125,211,252,0.45) 0%, rgba(56,189,248,0.50) 45%, rgba(3,105,161,0.62) 100%)' }}
        />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-3xl mx-auto text-center">

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.1] text-slate-900 mb-6">
            Discover Better Flight Deals.{' '}
            <span className="text-blue-700">Book Wherever You Trust.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-800 text-lg sm:text-xl font-medium leading-relaxed mb-8 max-w-xl mx-auto">
            Skip the endless searching. We find the best opportunities to travel, highlight the best dates to fly, and let you book directly with the airline or travel platform you trust.
          </p>

          {/* CTAs */}
          <div id="signup" className="flex flex-wrap gap-3 justify-center mb-6">
            <Link
              href="#deals"
              className="bg-white hover:bg-blue-50 text-blue-700 shadow-md font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              Browse Live Deals
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-slate-700 text-sm font-medium mb-9">
            ✓ Book directly with airlines &amp; trusted travel platforms &bull; No booking markups &bull; Carefully selected deals
          </p>

          <HeroDeals deals={deals} />
        </div>
      </section>

      {/* ── Live Deals ── */}
      <DealsSection deals={deals} />

      {/* ── What we do ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-2">Not every cheap flight is a good deal.</h2>
          <p className="text-center text-gray-500 text-lg mb-12 max-w-xl mx-auto">We look beyond the price.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'We find the drops',
                desc: 'We monitor international fares from India for unusually good prices.',
              },
              {
                icon: '✋',
                title: 'We cut out the noise',
                desc: 'Long layovers, awkward self-transfers and unnecessary transit hassles don\'t make the cut.',
              },
              {
                icon: '🔗',
                title: 'You choose where to book',
                desc: 'Found one you like? Book directly with the airline or travel site you trust.',
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
                desc: 'Savings of up to 90% on international flights. Every deal is verified before you see it.'
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
            <span className="flex items-center gap-1">💰 Up to 90% off</span>
            <span className="hidden sm:block text-blue-700">|</span>
            <span className="flex items-center gap-1">✅ Human-verified</span>
            <span className="hidden sm:block text-blue-700">|</span>
            <span className="flex items-center gap-1">🇮🇳 5 metros covered</span>
          </div>
        </div>
      </div>

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
          <div className="flex flex-wrap gap-3 justify-center">
            <HomeCTAButtons />
          </div>
          <p className="text-blue-400 text-xs mt-4">Join 200+ travellers already saving big</p>
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
                <FooterAuthLink />
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

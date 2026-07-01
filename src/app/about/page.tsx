import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'About Travelbaby — The story behind India\'s flight deal marketplace',
  description: 'Learn how Travelbaby connects Indian travellers with curated flight deals, travel creators, and boutique agents.',
}

const PILLARS = [
  {
    icon: '🧭',
    who: 'For Travellers',
    tagline: 'Great deals, no hunting',
    color: 'bg-blue-50 border-blue-100',
    accent: 'text-blue-700',
    desc: 'We monitor hundreds of routes from Delhi, Mumbai, Bangalore, Chennai and Hyderabad 24/7. The moment a price drops 40%+, we alert you by email — before the fare disappears.',
    cta: { label: 'Get free alerts', href: '/#signup' },
  },
  {
    icon: '🎬',
    who: 'For Travel Creators',
    tagline: 'Earn on bookings you inspire',
    color: 'bg-purple-50 border-purple-100',
    accent: 'text-purple-700',
    desc: 'Stop chasing brand deals. Share real flight deals with your audience and earn a 3–5% commission every time someone actually books. Payouts are automatic — no invoicing, no negotiating.',
    cta: { label: 'Join Creator waitlist', href: '/for-creators' },
  },
  {
    icon: '🏢',
    who: 'For Travel Agents',
    tagline: 'Qualified leads, no ad spend',
    color: 'bg-indigo-50 border-indigo-100',
    accent: 'text-indigo-700',
    desc: 'List your packages and tap into a network of motivated travel creators who promote your inventory to their engaged audiences. You only pay a commission when a booking confirms — not per click.',
    cta: { label: 'Join Agent waitlist', href: '/for-agents' },
  },
]

const VALUES = [
  { icon: '🎯', title: 'Only real deals', desc: 'We don\'t publish fares that are barely 10% off the normal price. If it\'s not remarkable, it doesn\'t make the cut.' },
  { icon: '⚡', title: 'Speed over noise', desc: 'One email alert per genuine deal — never a daily digest of mediocre offers. Your inbox stays clean.' },
  { icon: '🤝', title: 'Honest economics', desc: 'Creators earn on confirmed bookings, not clicks. Agents pay only on results. No vanity metrics.' },
  { icon: '🇮🇳', title: 'Built for India', desc: 'Prices in rupees. Routes from Indian metros. Advice for Indian passport holders. We\'re not a copy-paste of a Western deal site.' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-12 w-auto drop-shadow" />
          <span className="font-black text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/for-creators" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors hidden sm:block">For Creators</Link>
          <Link href="/for-agents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:block">For Agents</Link>
          <Link href="/#signup" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Get free alerts</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-slate-950 px-5 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">About Travelbaby</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            We built the deal-finding<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              engine India was missing.
            </span>
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto">
            Travelbaby is a three-sided marketplace where Indian travellers find real flight deals,
            travel creators earn commissions on bookings they inspire, and boutique agents get qualified leads — all without paying for ads.
          </p>
        </div>
      </section>

      {/* The problem we solve */}
      <section className="px-5 py-20 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-3xl font-black text-slate-900 mb-5 leading-tight">
              Flight deals disappear in hours. Most Indians never see them.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Airlines occasionally publish fares that are 40–90% below the going rate — mistake fares, flash sales, unsold inventory. These windows last 4–24 hours. If you happen to be browsing at the right moment, you win. If not, you pay full price.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Meanwhile, travel creators with engaged audiences have no clean way to earn from the travel decisions they influence. And boutique travel agents — who know their destinations better than any OTA — have no affordable way to reach motivated buyers.
            </p>
          </div>
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6">What changes with Travelbaby</p>
            <div className="space-y-5">
              {[
                { before: 'You stumble on a deal — or you don\'t', after: 'You get alerted the moment a deal drops' },
                { before: 'Creators post travel content for likes', after: 'Creators earn on every booking they drive' },
                { before: 'Agents spend lakhs on Google Ads', after: 'Agents pay only when bookings confirm' },
              ].map((row, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-red-400 text-xs">✕</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm line-through">{row.before}</p>
                    <div className="flex gap-2 items-start mt-1">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <p className="text-white text-sm font-semibold">{row.after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-5 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-black text-slate-900">One platform, three experiences</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map(p => (
              <div key={p.who} className={`rounded-3xl border p-7 ${p.color}`}>
                <span className="text-4xl block mb-4">{p.icon}</span>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{p.who}</p>
                <h3 className={`text-xl font-black mb-3 ${p.accent}`}>{p.tagline}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">{p.desc}</p>
                <Link href={p.cta.href}
                  className={`text-sm font-bold ${p.accent} hover:underline`}>
                  {p.cta.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-3">What we stand for</p>
            <h2 className="text-3xl font-black text-white">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <span className="text-3xl block mb-3">{v.icon}</span>
                <h3 className="font-black text-white text-lg mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Join 1,200+ Indian travellers</h2>
          <p className="text-slate-600 mb-8">Get curated flight deal alerts — free, no spam, unsubscribe any time.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/#signup"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-4 rounded-xl transition-colors text-center">
              Get free alerts →
            </Link>
            <Link href="/for-creators"
              className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-6 py-4 rounded-xl transition-colors text-center">
              Become a Creator
            </Link>
            <Link href="/for-agents"
              className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-6 py-4 rounded-xl transition-colors text-center">
              List as Agent
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-5 py-8 text-center text-sm text-slate-400">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <Link href="/for-creators" className="hover:text-slate-600 transition-colors">For Creators</Link>
          <Link href="/for-agents" className="hover:text-slate-600 transition-colors">For Agents</Link>
        </div>
        <p>© 2025 Travelbaby. Built with ❤️ for Indian travellers.</p>
      </footer>

    </main>
  )
}

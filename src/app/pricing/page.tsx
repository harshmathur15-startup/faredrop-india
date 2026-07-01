import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Pricing — Travelbaby' }

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-3">Choose your membership</h1>
          <p className="text-gray-500 text-lg">Start free. Upgrade anytime. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 flex flex-col">
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Free</h3>
            <p className="text-gray-600 text-sm mb-6">Limited deals, economy only</p>
            <p className="font-display text-3xl font-bold text-slate-900 mb-8">₹0</p>

            <ul className="space-y-3 mb-10 flex-grow">
              {[
                { ok: true,  text: 'Deal alerts via email' },
                { ok: true,  text: 'Economy-class only' },
                { ok: true,  text: 'Limited deal selection' },
                { ok: false, text: 'Business/First class' },
                { ok: false, text: 'Real-time alerts' },
                { ok: false, text: 'Concierge support' },
              ].map(({ ok, text }) => (
                <li key={text} className={`flex gap-3 text-sm ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
                  <span className={`font-black text-lg ${ok ? 'text-green-600' : 'text-gray-400'}`}>{ok ? '✓' : '✗'}</span>
                  {text}
                </li>
              ))}
            </ul>

            <Link href="/signup" className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors">
              Get started free
            </Link>
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
              {[
                'Everything in Free, plus:',
                'Real-time deal alerts',
                'Business & First class deals',
                'All international routes',
                'Mistake fares & rare finds',
              ].map(text => (
                <li key={text} className="flex gap-3 text-white text-sm">
                  <span className="text-amber-400 font-black text-lg">✓</span>
                  {text}
                </li>
              ))}
              <li className="flex gap-3 text-slate-300 text-sm">
                <span className="text-slate-400 font-black text-lg">✗</span>
                Concierge support
              </li>
            </ul>

            <Link href="/signup" className="block w-full text-center bg-white hover:bg-gray-100 text-slate-700 font-bold py-3 rounded-xl transition-colors">
              Start 7-day free trial
            </Link>
          </div>

          {/* Gold Plan */}
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 border-2 border-amber-300 relative shadow-xl flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black whitespace-nowrap">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-black text-amber-900 mb-2">Gold</h3>
            <p className="text-amber-800 text-sm mb-6">Premium access + concierge</p>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-3xl font-black text-amber-900">₹1,999</p>
                <p className="text-lg text-amber-700 line-through">₹2,999</p>
              </div>
              <p className="text-amber-800 text-xs">per month</p>
              <p className="text-amber-800 text-xs mt-3">or</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-black text-amber-900">₹9,999</p>
                <p className="text-sm text-amber-700 line-through">₹14,999</p>
              </div>
              <p className="text-amber-800 text-xs">per year (save 33%)</p>
            </div>

            <ul className="space-y-3 mb-10 flex-grow">
              {[
                'Everything in Silver, plus:',
                '2 Concierge calls/month',
                'Personal booking assistance',
                'Priority deal notifications',
                'Exclusive error/hack fares',
                'VIP email support',
              ].map(text => (
                <li key={text} className="flex gap-3 text-amber-900 text-sm">
                  <span className="font-black text-lg">✓</span>
                  {text}
                </li>
              ))}
            </ul>

            <Link href="/signup" className="block w-full text-center bg-amber-900 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors">
              Upgrade to Gold
            </Link>
            <p className="text-center text-amber-800 text-xs mt-3">Best value for frequent travelers</p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">
          All plans include human-verified deals · No booking fees · Cancel anytime
        </p>
      </div>
    </main>
  )
}

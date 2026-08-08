'use client'

import { useState } from 'react'
import Link from 'next/link'

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function PricingCards() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-white border border-gray-200 rounded-full p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              !annual ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              annual ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full transition-all ${
              annual ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700'
            }`}>
              Save 50%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 flex flex-col">
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-1">Free</h3>
          <p className="text-gray-500 text-sm mb-6">Limited deals, economy only</p>

          <div className="mb-8">
            <p className="font-display text-4xl font-bold text-slate-900">₹0</p>
            <p className="text-gray-400 text-sm mt-1">forever</p>
          </div>

          <ul className="space-y-3 mb-10 flex-grow">
            {[
              { ok: true,  text: 'Deal alerts via email' },
              { ok: true,  text: 'Economy-class only' },
              { ok: true,  text: 'Limited deal selection' },
              { ok: false, text: 'Business & First class' },
              { ok: false, text: 'Real-time alerts' },
              { ok: false, text: 'Concierge support' },
            ].map(({ ok, text }) => (
              <li key={text} className={`flex gap-3 text-sm ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
                <span className={`font-black text-base ${ok ? 'text-green-600' : 'text-gray-300'}`}>{ok ? '✓' : '✗'}</span>
                {text}
              </li>
            ))}
          </ul>

          <Link href="/signup" className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors">
            Get started free
          </Link>
        </div>

        {/* Silver */}
        <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-3xl p-8 border-2 border-slate-500 flex flex-col relative shadow-xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-black whitespace-nowrap">
            MOST POPULAR
          </div>

          <h3 className="text-2xl font-black text-white mb-1">Silver</h3>
          <p className="text-slate-300 text-sm mb-6">Real-time deals, all classes</p>

          <div className="mb-8 min-h-[80px]">
            {annual ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-4xl font-black text-white">{INR(1199)}</p>
                  <p className="text-slate-400 text-sm line-through">{INR(2399)}</p>
                </div>
                <p className="text-slate-300 text-sm">per year · <span className="text-green-400 font-semibold">{INR(100)}/mo</span></p>
                <p className="text-green-400 text-xs mt-1 font-semibold">You save {INR(1200)} vs monthly</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-4xl font-black text-white">{INR(1)}</p>
                  <p className="text-slate-400 text-sm line-through">{INR(199)}</p>
                </div>
                <p className="text-slate-300 text-sm">first month, then <span className="font-semibold text-white">{INR(199)}/mo</span></p>
              </>
            )}
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
                <span className="text-amber-400 font-black text-base">✓</span>
                {text}
              </li>
            ))}
            <li className="flex gap-3 text-slate-400 text-sm">
              <span className="text-slate-500 font-black text-base">✗</span>
              Concierge support
            </li>
          </ul>

          <Link href="/signup" className="block w-full text-center bg-white hover:bg-gray-100 text-slate-700 font-bold py-3 rounded-xl transition-colors">
            {annual ? `Get Silver for ${INR(1199)}/yr` : 'Try Silver for ₹1'}
          </Link>
        </div>

        {/* Gold */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 border-2 border-amber-300 flex flex-col relative shadow-xl">
          <h3 className="text-2xl font-black text-amber-900 mb-1">Gold</h3>
          <p className="text-amber-800 text-sm mb-6">Premium access + concierge</p>

          <div className="mb-8 min-h-[80px]">
            {annual ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-4xl font-black text-amber-900">{INR(9999)}</p>
                  <p className="text-amber-700 text-sm line-through">{INR(14999)}</p>
                </div>
                <p className="text-amber-800 text-sm">per year · <span className="font-semibold">{INR(833)}/mo</span></p>
                <p className="text-amber-900 text-xs mt-1 font-semibold">You save {INR(5000)} vs monthly</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-4xl font-black text-amber-900">{INR(1999)}</p>
                  <p className="text-amber-700 text-sm line-through">{INR(2999)}</p>
                </div>
                <p className="text-amber-800 text-sm">per month</p>
              </>
            )}
          </div>

          <ul className="space-y-3 mb-10 flex-grow">
            {[
              'Everything in Silver, plus:',
              '2 Concierge calls/month',
              'Personal booking assistance',
              'Priority deal notifications',
              'Exclusive error & hack fares',
              'VIP email support',
            ].map(text => (
              <li key={text} className="flex gap-3 text-amber-900 text-sm">
                <span className="font-black text-base">✓</span>
                {text}
              </li>
            ))}
          </ul>

          <Link href="/signup" className="block w-full text-center bg-amber-900 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors">
            {annual ? `Get Gold for ${INR(9999)}/yr` : 'Upgrade to Gold'}
          </Link>
          <p className="text-center text-amber-800 text-xs mt-3">Best value for frequent travelers</p>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

type Cta = { href: string; text: string; cls: string }
type Tab = { id: string; label: string; line: string; activeTab: string; ctas: Cta[] }

// Note: Tailwind class names are written out in full (not composed) so the JIT compiler picks them up.
const TABS: Tab[] = [
  {
    id: 'traveller',
    label: '✈️ Traveller',
    line: 'Get instant alerts on real return-flight deals from India — save up to 90%.',
    activeTab: 'bg-blue-600 text-white shadow',
    ctas: [
      { href: '/signup', text: 'Sign up to get alerts', cls: 'bg-blue-600 hover:bg-blue-500 text-white' },
      { href: '/login', text: 'Log in', cls: 'bg-white/90 hover:bg-white text-blue-700 border border-white/70' },
    ],
  },
  {
    id: 'agent',
    label: '🏢 Agent',
    line: 'Sell unsold seats & packages to ready-to-book buyers — with zero ad spend.',
    activeTab: 'bg-indigo-600 text-white shadow',
    ctas: [
      { href: '/for-agents', text: 'List your deals →', cls: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
    ],
  },
  {
    id: 'creator',
    label: '🎥 Creator',
    line: 'Promote curated deals to your audience and earn a commission on every booking.',
    activeTab: 'bg-purple-600 text-white shadow',
    ctas: [
      { href: '/for-creators', text: 'Start earning →', cls: 'bg-purple-600 hover:bg-purple-500 text-white' },
    ],
  },
]

export default function MarketplaceHeroTabs() {
  const [active, setActive] = useState('traveller')
  const tab = TABS.find((t) => t.id === active) ?? TABS[0]

  return (
    <div className="max-w-xl mx-auto">
      {/* Audience selector */}
      <div className="inline-flex bg-white/85 backdrop-blur-sm rounded-full p-1 mb-4 shadow-sm border border-white/60">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-5 sm:px-6 py-2.5 rounded-full text-base sm:text-lg font-bold transition-colors ${
              active === t.id ? t.activeTab : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Audience-specific CTAs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {tab.ctas.map((c) => (
          <Link
            key={c.text}
            href={c.href}
            className={`font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap ${c.cls}`}
          >
            {c.text}
          </Link>
        ))}
      </div>
    </div>
  )
}

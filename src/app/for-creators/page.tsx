'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const BENEFITS = [
  {
    icon: '💸',
    title: 'Earn real commissions',
    desc: 'Get paid every time someone books through your link. No brand deal negotiations. Automated payouts.',
  },
  {
    icon: '✈️',
    title: 'Promote curated flight deals',
    desc: 'Access exclusive fare drops your audience can actually book — not generic ads nobody clicks.',
  },
  {
    icon: '📊',
    title: 'Track bookings & earnings in real time',
    desc: 'See which content drives confirmed bookings — not just clicks. Double down on what actually pays.',
  },
  {
    icon: '🤝',
    title: 'Get matched with travel agents',
    desc: 'Agents pay to run campaigns through you. You earn without cold-pitching brands.',
  },
]

const STEPS = [
  { n: '01', title: 'Apply & get verified', desc: 'Tell us your niche, platforms and audience size. Takes 2 minutes.' },
  { n: '02', title: 'Get your affiliate link', desc: 'Every deal gets a unique link tied to your profile. Share anywhere.' },
  { n: '03', title: 'Earn on every booking', desc: 'We track conversions and deposit earnings weekly. No chasing invoices.' },
]

const STATS = [
  { value: '₹8K–₹30K', label: 'typical monthly earnings for active creators' },
  { value: 'Bookings only', label: 'you earn on confirmed bookings, not clicks' },
  { value: '3–5%', label: 'commission on booking value' },
  { value: '₹0', label: 'cost to join' },
]

const PLATFORMS = ['Instagram', 'YouTube', 'Twitter / X', 'Blog / Website', 'LinkedIn', 'Threads']
const FOLLOWER_RANGES = ['Under 5K', '5K – 25K', '25K – 100K', '100K – 500K', '500K+']

export default function ForCreatorsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    handle: '',
    platform: '',
    followers: '',
    niche: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'creator', ...form }),
      })
    } catch {}
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
          <span className="font-black text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/for-agents" className="text-sm font-semibold text-gray-600 hover:text-purple-700 hidden sm:block">For Travel Agents</Link>
          <Link href="/#signup" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Get deal alerts</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 px-5 pt-20 pb-24 text-white text-center">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-white/30 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Creator Hub — Coming Soon
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Turn your travel content{' '}
            <span className="text-yellow-300">into income</span>
          </h1>

          <p className="text-purple-100 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Join India&apos;s first travel creator network. Promote real flight deals to your audience and earn commissions on every booking — no brand pitching, no delayed payments.
          </p>

          <a href="#apply" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg">
            Join the waitlist →
          </a>
          <p className="text-purple-200 text-sm mt-4">Free to join. No minimum follower count.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-purple-900 text-white px-5 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-yellow-300">{s.value}</p>
              <p className="text-purple-300 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900">How it works</h2>
            <p className="text-gray-500 mt-2">Three steps from sign-up to first payout</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.n} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 font-black text-lg rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-5 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900">Why creators love Travelbaby</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl shrink-0">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample dashboard preview */}
      <section className="px-5 py-16 bg-gradient-to-br from-purple-50 to-violet-50">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900">Your Creator Dashboard</h2>
          <p className="text-gray-500 mt-2">See exactly how your content is performing, in real time</p>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Mock dashboard header */}
          <div className="bg-purple-700 px-6 py-4 flex items-center justify-between text-white">
            <div>
              <p className="text-purple-200 text-xs">Welcome back,</p>
              <p className="font-black text-lg">WanderWithYou 👋</p>
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-xs">Earned This Month</p>
              <p className="font-black text-xl text-yellow-300">₹10,800</p>
            </div>
          </div>
          {/* Mock stats */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: 'Link Visits', value: '1,200', change: '+18%' },
              { label: 'Bookings', value: '9', change: '+14%' },
              { label: 'Commission', value: '4%', change: 'of pkg value' },
              { label: 'Earned', value: '₹10,800', change: '+22%' },
            ].map(m => (
              <div key={m.label} className="p-4 text-center">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-lg font-black text-gray-900">{m.value}</p>
                <p className="text-xs text-green-600 font-semibold">{m.change}</p>
              </div>
            ))}
          </div>
          {/* Mock campaign list */}
          <div className="p-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Campaigns — Earnings on confirmed bookings only</p>
            {[
              { name: 'Bali Summer Package', dates: '10 May – 10 Jun', bookings: '4 bookings', earn: '₹4,800' },
              { name: 'Thailand Monsoon Getaway', dates: '01 May – 31 May', bookings: '3 bookings', earn: '₹3,600' },
              { name: 'Dubai Escape', dates: '16 Apr – 15 May', bookings: '2 bookings', earn: '₹2,400' },
            ].map(c => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.dates}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{c.bookings}</p>
                  <p className="font-bold text-sm text-green-600">{c.earn}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-yellow-50 border-t border-yellow-100 text-center">
            <p className="text-yellow-700 text-sm font-semibold">🔒 Full dashboard unlocks after approval</p>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="px-5 py-20 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900">Join the waitlist</h2>
            <p className="text-gray-500 mt-2">We&apos;re onboarding creators in batches. Apply now to get early access.</p>
          </div>

          {submitted ? (
            <div className="text-center bg-purple-50 border border-purple-200 rounded-2xl p-10">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">You&apos;re on the list!</h3>
              <p className="text-gray-500">We&apos;ll reach out to <strong>{form.email}</strong> when your batch opens.</p>
              <p className="text-gray-400 text-sm mt-3">Expected: Q3 2026</p>
              <Link href="/" className="inline-block mt-6 text-purple-600 font-bold hover:underline">← Browse flight deals</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@email.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Primary platform *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => set('platform', p)}
                      className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${form.platform === p ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Handle / Channel URL</label>
                  <input value={form.handle} onChange={e => set('handle', e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Follower count</label>
                  <select value={form.followers} onChange={e => set('followers', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Select range</option>
                    {FOLLOWER_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Travel niche / content style</label>
                <input value={form.niche} onChange={e => set('niche', e.target.value)}
                  placeholder="e.g. Budget backpacking, Luxury escapes, Family travel…"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>

              <button type="submit" disabled={loading || !form.name || !form.email || !form.platform}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-lg rounded-xl transition-colors">
                {loading ? 'Submitting…' : 'Join Creator Waitlist →'}
              </button>
              <p className="text-center text-xs text-gray-400">No spam. We&apos;ll only reach out when your batch opens.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-purple-900 text-white px-5 py-12 text-center">
        <h3 className="text-2xl font-black mb-2">Also a travel agent?</h3>
        <p className="text-purple-300 mb-6">Join our Agent OS waitlist to promote packages through our creator network.</p>
        <Link href="/for-agents" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors">
          View Agent Waitlist →
        </Link>
      </section>
    </main>
  )
}

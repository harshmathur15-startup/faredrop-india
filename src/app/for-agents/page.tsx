'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const BENEFITS = [
  {
    icon: '🎯',
    title: 'High-intent leads, not cold clicks',
    desc: 'Travellers who clicked a fare alert already want to travel. You receive their destination, budget and dates.',
  },
  {
    icon: '📢',
    title: 'Promote through trusted creators',
    desc: 'Run campaigns through verified travel influencers who already have your target audience.',
  },
  {
    icon: '📈',
    title: 'Benchmark against competitors',
    desc: 'See how your conversion rates and pricing compare across similar agencies in your city.',
  },
  {
    icon: '🤖',
    title: 'Pay creators only when bookings happen',
    desc: 'No upfront ad budget. Creators earn 5% commission on confirmed bookings — you keep the rest.',
  },
]

const STEPS = [
  { n: '01', title: 'Create your agency profile', desc: 'List your specialities, destinations and package types. Takes under 5 minutes.' },
  { n: '02', title: 'Launch a campaign', desc: 'Choose creators who match your target audience. Set budget and duration.' },
  { n: '03', title: 'Receive qualified leads', desc: 'Travellers arrive pre-qualified with destination, budget and travel dates filled in.' },
]

const STATS = [
  { value: '40–60', label: 'qualified leads received per month' },
  { value: '10–15%', label: 'avg. lead-to-booking conversion' },
  { value: '5%', label: 'creator commission paid per confirmed booking' },
  { value: '₹0', label: 'upfront ad spend needed' },
]

const SPECIALITIES = [
  'Honeymoon', 'Family', 'Adventure', 'Luxury', 'Budget',
  'Group Tours', 'Visa Assistance', 'Corporate Travel',
]

const SIZES = ['Solo agent', '2–5 people', '6–20 people', '20+ people']

export default function ForAgentsPage() {
  const [form, setForm] = useState({
    name: '',
    agency: '',
    email: '',
    city: '',
    website: '',
    specialities: [] as string[],
    size: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function toggleSpec(s: string) {
    setForm(prev => ({
      ...prev,
      specialities: prev.specialities.includes(s)
        ? prev.specialities.filter(x => x !== s)
        : [...prev.specialities, s],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', ...form }),
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
          <Link href="/for-creators" className="text-sm font-semibold text-gray-600 hover:text-indigo-700 hidden sm:block">For Creators</Link>
          <Link href="/#signup" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Get deal alerts</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 px-5 pt-20 pb-24 text-white text-center">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-white/30 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Agent OS — Coming Soon
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Grow your agency{' '}
            <span className="text-cyan-300">without burning on ads</span>
          </h1>

          <p className="text-blue-100 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Get high-intent leads from travellers who are already planning a trip. Partner with travel creators. Benchmark your performance. All in one place.
          </p>

          <a href="#apply" className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg">
            Join Agent Waitlist →
          </a>
          <p className="text-blue-200 text-sm mt-4">Free during beta. No lock-in contracts.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-indigo-900 text-white px-5 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-cyan-300">{s.value}</p>
              <p className="text-indigo-300 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900">How it works</h2>
            <p className="text-gray-500 mt-2">From signup to your first qualified lead in days</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.n} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 font-black text-lg rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h2 className="text-4xl font-black text-gray-900">Why agencies choose Travelbaby</h2>
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

      {/* Mock dashboard preview */}
      <section className="px-5 py-16 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900">Your Agent Dashboard</h2>
          <p className="text-gray-500 mt-2">Track leads, campaigns and competitor benchmarks in one place</p>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Mock header */}
          <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between text-white">
            <div>
              <p className="text-indigo-200 text-xs">Welcome back,</p>
              <p className="font-black text-lg">Paradise Holidays ✈️</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs">Booking Value This Month</p>
              <p className="font-black text-xl text-cyan-300">₹2,40,000</p>
            </div>
          </div>
          {/* Mock stats */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: 'Leads', value: '42', change: '+20%' },
              { label: 'Confirmed', value: '5', change: '+17%' },
              { label: 'Conv. Rate', value: '11.9%', change: '+8%' },
              { label: 'Creator Cost', value: '₹12,000', change: '5% of sales' },
            ].map(m => (
              <div key={m.label} className="p-4 text-center">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-lg font-black text-gray-900">{m.value}</p>
                <p className="text-xs text-green-600 font-semibold">{m.change}</p>
              </div>
            ))}
          </div>
          {/* Mock leads table */}
          <div className="p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Recent Leads</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-1 text-xs text-gray-400 font-semibold">Lead ID</th>
                    <th className="text-left py-2 px-1 text-xs text-gray-400 font-semibold">Destination</th>
                    <th className="text-left py-2 px-1 text-xs text-gray-400 font-semibold">Budget</th>
                    <th className="text-left py-2 px-1 text-xs text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-2 px-1 text-xs text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'TB12345', dest: 'Bali', budget: '₹60,000', date: '18 Jun', status: 'New', color: 'text-blue-600 bg-blue-50' },
                    { id: 'TB12344', dest: 'Thailand', budget: '₹60,000', date: '18 Jun', status: 'Contacted', color: 'text-yellow-700 bg-yellow-50' },
                    { id: 'TB12343', dest: 'Singapore', budget: '₹70,000', date: '17 Jun', status: 'Converted', color: 'text-green-700 bg-green-50' },
                    { id: 'TB12342', dest: 'Europe', budget: '₹1,80,000', date: '16 Jun', status: 'Contacted', color: 'text-yellow-700 bg-yellow-50' },
                  ].map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-1 text-gray-600 font-mono text-xs">{l.id}</td>
                      <td className="py-2.5 px-1 font-semibold text-gray-900">{l.dest}</td>
                      <td className="py-2.5 px-1 text-gray-600">{l.budget}</td>
                      <td className="py-2.5 px-1 text-gray-400 text-xs">{l.date}</td>
                      <td className="py-2.5 px-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${l.color}`}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-5 py-4 bg-cyan-50 border-t border-cyan-100 text-center">
            <p className="text-cyan-700 text-sm font-semibold">🔒 Full dashboard unlocks after approval</p>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="px-5 py-20 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900">Join the waitlist</h2>
            <p className="text-gray-500 mt-2">We&apos;re onboarding agencies in batches. Secure your spot early.</p>
          </div>

          {submitted ? (
            <div className="text-center bg-indigo-50 border border-indigo-200 rounded-2xl p-10">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">You&apos;re on the list!</h3>
              <p className="text-gray-500">We&apos;ll reach out to <strong>{form.email}</strong> when your batch opens.</p>
              <p className="text-gray-400 text-sm mt-3">Expected: Q3 2026</p>
              <Link href="/" className="inline-block mt-6 text-indigo-600 font-bold hover:underline">← Browse flight deals</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Rajesh Kumar"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Agency name *</label>
                  <input required value={form.agency} onChange={e => set('agency', e.target.value)}
                    placeholder="Paradise Holidays"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@agency.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Delhi, Mumbai, Bangalore…"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Agency website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://youragency.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Specialities (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALITIES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpec(s)}
                      className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${form.specialities.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button key={s} type="button" onClick={() => set('size', s)}
                      className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${form.size === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !form.name || !form.agency || !form.email}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-lg rounded-xl transition-colors">
                {loading ? 'Submitting…' : 'Join Agent Waitlist →'}
              </button>
              <p className="text-center text-xs text-gray-400">Free during beta. We&apos;ll only reach out when your batch opens.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-indigo-900 text-white px-5 py-12 text-center">
        <h3 className="text-2xl font-black mb-2">Are you a travel creator?</h3>
        <p className="text-indigo-300 mb-6">Join our Creator Hub to earn commissions promoting travel deals to your audience.</p>
        <Link href="/for-creators" className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
          View Creator Waitlist →
        </Link>
      </section>
    </main>
  )
}

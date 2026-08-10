'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

function upcomingMonths(count = 12): string[] {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < count; i++) {
    out.push(d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))
    d.setMonth(d.getMonth() + 1)
  }
  return out
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900'
const labelCls = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5'

export default function RequestDealPage() {
  const months = useMemo(() => upcomingMonths(), [])
  const [form, setForm] = useState({
    departure_month: '', trip_scope: 'International', trip_duration_days: '',
    dest_city: '', dest_country: '', trip_type: 'Round trip',
    origin_city: '', email: '', name: '', notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email
      if (email) setForm(f => ({ ...f, email: f.email || email }))
    })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('sending')
    try {
      const res = await fetch('/api/request-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Something went wrong. Please try again.')
      }
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  const oneWay = form.trip_type === 'One way'

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-11 w-auto drop-shadow" />
          <span className="font-black text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href="/#deals" className="text-sm font-semibold text-blue-700 hover:underline">← Back to deals</Link>
      </nav>

      <div className="flex-1 px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">Can&apos;t find your deal?</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Tell us where you want to go</h1>
          <p className="text-slate-600 mb-8">
            Share your trip and our team will hunt for the best fare and get back to you. The more specific, the better we can help.
          </p>

          {status === 'done' ? (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
              <p className="text-5xl mb-3">🎯</p>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Request received!</h2>
              <p className="text-slate-600 mb-6">Our team is on it. We&apos;ll email you at <span className="font-semibold">{form.email}</span> when we find a great fare.</p>
              <Link href="/#deals" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-xl transition-colors">
                Browse live deals
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Destination */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Destination city *</label>
                  <input type="text" required placeholder="e.g. Bali" value={form.dest_city} onChange={e => set('dest_city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Destination country *</label>
                  <input type="text" required placeholder="e.g. Indonesia" value={form.dest_country} onChange={e => set('dest_country', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Month + scope */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Month of departure *</label>
                  <select required value={form.departure_month} onChange={e => set('departure_month', e.target.value)} className={inputCls}>
                    <option value="" disabled>Select a month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Domestic or International *</label>
                  <div className="flex gap-2">
                    {(['Domestic', 'International'] as const).map(s => (
                      <button type="button" key={s} onClick={() => set('trip_scope', s)}
                        className={`flex-1 px-3 py-3 rounded-xl text-sm font-bold border transition-colors ${form.trip_scope === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-300 hover:border-blue-400'}`}>
                        {s === 'Domestic' ? '🏠 Domestic' : '✈ International'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trip type + duration */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>One way or round trip *</label>
                  <div className="flex gap-2">
                    {(['One way', 'Round trip'] as const).map(t => (
                      <button type="button" key={t} onClick={() => set('trip_type', t)}
                        className={`flex-1 px-3 py-3 rounded-xl text-sm font-bold border transition-colors ${form.trip_type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-300 hover:border-blue-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Trip duration (days){oneWay ? '' : ' *'}</label>
                  <input type="number" min={1} max={365} required={!oneWay} disabled={oneWay}
                    placeholder={oneWay ? 'Not needed for one way' : 'e.g. 6'}
                    value={oneWay ? '' : form.trip_duration_days} onChange={e => set('trip_duration_days', e.target.value)}
                    className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400`} />
                </div>
              </div>

              {/* Origin (optional) */}
              <div>
                <label className={labelCls}>Departing from (optional)</label>
                <input type="text" placeholder="e.g. Delhi" value={form.origin_city} onChange={e => set('origin_city', e.target.value)} className={inputCls} />
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Anything else? (optional)</label>
                <textarea rows={3} placeholder="Budget, flexible dates, preferred airline, cabin class…" value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} />
              </div>

              {/* Contact */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className={labelCls}>Your name (optional)</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Your email *</label>
                  <input type="email" required placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button type="submit" disabled={status === 'sending'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {status === 'sending' ? 'Sending…' : 'Submit request →'}
              </button>
              <p className="text-center text-gray-400 text-xs">We&apos;ll only use your email to send you this deal.</p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

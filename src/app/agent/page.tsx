'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authHeaders } from '@/lib/api-client'
import type { AgentPackage, Profile } from '@/types/marketplace'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900'
const label = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1'

const emptyPkg = {
  title: '', destination: '', description: '', price_per_person: '',
  duration_days: '', start_date: '', end_date: '', inclusions: '', image_url: '',
}

function StatusBadge({ p }: { p: AgentPackage }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const text: Record<string, string> = {
    pending: '⏳ Under Travel Baby review',
    verified: '✅ Live for creators',
    rejected: '✕ Rejected',
  }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[p.verification_status]}`}>
      {text[p.verification_status]}
      {p.verification_status === 'verified' && p.visible_to_travellers ? ' + travellers' : ''}
    </span>
  )
}

export default function AgentPage() {
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'authed'>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packages, setPackages] = useState<AgentPackage[]>([])
  const [reg, setReg] = useState({ full_name: '', phone: '', agency_name: '', agency_city: '' })
  const [pkg, setPkg] = useState({ ...emptyPkg })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/profile', { headers: await authHeaders() })
    if (res.ok) setProfile((await res.json()).profile)
  }, [])

  const loadPackages = useCallback(async () => {
    const res = await fetch('/api/agent/packages', { headers: await authHeaders() })
    if (res.ok) setPackages((await res.json()).packages ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setAuthState('anon'); return }
      setAuthState('authed')
      await loadProfile()
      await loadPackages()
    })
  }, [loadProfile, loadPackages])

  async function register(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: await authHeaders(),
      body: JSON.stringify({ role: 'agent', ...reg }),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? 'Failed'); return }
    await loadProfile(); await loadPackages()
  }

  async function createPackage(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const res = await fetch('/api/agent/packages', {
      method: 'POST', headers: await authHeaders(),
      body: JSON.stringify(pkg),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? 'Failed'); return }
    setPkg({ ...emptyPkg })
    await loadPackages()
  }

  if (authState === 'loading') {
    return <Shell><p className="text-center text-slate-400 py-12">Loading…</p></Shell>
  }

  if (authState === 'anon') {
    return (
      <Shell>
        <div className="text-center py-10 space-y-4">
          <h1 className="font-display text-2xl font-bold text-slate-900">For Travel Agents</h1>
          <p className="text-slate-500 text-sm">Sign in to post travel packages for our creator network to promote.</p>
          <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl">
            Sign in / Sign up →
          </Link>
        </div>
      </Shell>
    )
  }

  // Authed but not yet an agent → register.
  if (profile?.role !== 'agent') {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Register as a Travel Agent</h1>
        <p className="text-slate-500 text-sm mb-5">Post packages that Travel Baby verifies before creators promote them.</p>
        <form onSubmit={register} className="space-y-3">
          <div><label className={label}>Your name</label><input className={inputCls} value={reg.full_name} onChange={e => setReg({ ...reg, full_name: e.target.value })} /></div>
          <div><label className={label}>Phone</label><input className={inputCls} value={reg.phone} onChange={e => setReg({ ...reg, phone: e.target.value })} placeholder="+91…" /></div>
          <div><label className={label}>Agency name *</label><input className={inputCls} value={reg.agency_name} onChange={e => setReg({ ...reg, agency_name: e.target.value })} required /></div>
          <div><label className={label}>City</label><input className={inputCls} value={reg.agency_city} onChange={e => setReg({ ...reg, agency_city: e.target.value })} /></div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-60">
            {saving ? 'Saving…' : 'Become a Travel Agent →'}
          </button>
        </form>
      </Shell>
    )
  }

  // Agent dashboard.
  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{profile.agency_name ?? 'Agent'} · Packages</h1>
          <p className="text-slate-500 text-sm">Post a package — it goes live to creators once Travel Baby verifies it.</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full">Home</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* New package form */}
        <form onSubmit={createPackage} className="bg-white rounded-2xl shadow p-5 space-y-3 h-fit">
          <p className="font-bold text-slate-900">Post a new package</p>
          <div><label className={label}>Title *</label><input className={inputCls} value={pkg.title} onChange={e => setPkg({ ...pkg, title: e.target.value })} placeholder="7-day Bali honeymoon" required /></div>
          <div><label className={label}>Destination *</label><input className={inputCls} value={pkg.destination} onChange={e => setPkg({ ...pkg, destination: e.target.value })} placeholder="Bali, Indonesia" required /></div>
          <div><label className={label}>Description</label><textarea className={inputCls} rows={2} value={pkg.description} onChange={e => setPkg({ ...pkg, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Price / person (₹)</label><input type="number" className={inputCls} value={pkg.price_per_person} onChange={e => setPkg({ ...pkg, price_per_person: e.target.value })} placeholder="45000" /></div>
            <div><label className={label}>Duration (days)</label><input type="number" className={inputCls} value={pkg.duration_days} onChange={e => setPkg({ ...pkg, duration_days: e.target.value })} placeholder="7" /></div>
            <div><label className={label}>Start date</label><input type="date" className={inputCls} value={pkg.start_date} onChange={e => setPkg({ ...pkg, start_date: e.target.value })} /></div>
            <div><label className={label}>End date</label><input type="date" className={inputCls} value={pkg.end_date} onChange={e => setPkg({ ...pkg, end_date: e.target.value })} /></div>
          </div>
          <div><label className={label}>Inclusions</label><textarea className={inputCls} rows={2} value={pkg.inclusions} onChange={e => setPkg({ ...pkg, inclusions: e.target.value })} placeholder="Flights, 4★ hotel, breakfast, transfers…" /></div>
          <div><label className={label}>Image URL</label><input className={inputCls} value={pkg.image_url} onChange={e => setPkg({ ...pkg, image_url: e.target.value })} placeholder="https://…" /></div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl disabled:opacity-60">
            {saving ? 'Posting…' : 'Submit for review →'}
          </button>
        </form>

        {/* Own packages */}
        <div className="space-y-3">
          <p className="font-bold text-slate-900">Your packages ({packages.length})</p>
          {packages.length === 0 && <p className="text-sm text-slate-400 bg-white rounded-2xl p-6 text-center">No packages yet.</p>}
          {packages.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.destination}{p.price_per_person ? ` · ₹${p.price_per_person.toLocaleString('en-IN')}/person` : ''}</p>
                </div>
                <StatusBadge p={p} />
              </div>
              {p.verification_status === 'rejected' && p.rejection_reason && (
                <p className="text-xs text-red-500 mt-2">Reason: {p.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className={`mx-auto ${wide ? 'max-w-4xl' : 'max-w-md bg-white rounded-3xl shadow-md border border-gray-100 p-8'}`}>
        {children}
      </div>
    </main>
  )
}

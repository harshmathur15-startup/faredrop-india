'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authHeaders } from '@/lib/api-client'
import type { AgentPackage, Profile } from '@/types/marketplace'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900'
const label = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1'

export default function CreatorPage() {
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'authed'>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packages, setPackages] = useState<AgentPackage[]>([])
  const [reg, setReg] = useState({ full_name: '', instagram_handle: '', audience_size: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async (): Promise<Profile | null> => {
    const res = await fetch('/api/profile', { headers: await authHeaders() })
    if (!res.ok) return null
    const p = (await res.json()).profile as Profile
    setProfile(p)
    return p
  }, [])

  const loadPackages = useCallback(async () => {
    const res = await fetch('/api/creator/packages', { headers: await authHeaders() })
    if (res.ok) setPackages((await res.json()).packages ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setAuthState('anon'); return }
      setAuthState('authed')
      const p = await loadProfile()
      if (p?.role === 'creator') await loadPackages()
    })
  }, [loadProfile, loadPackages])

  async function register(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: await authHeaders(),
      body: JSON.stringify({ role: 'creator', ...reg }),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? 'Failed'); return }
    const p = await loadProfile()
    if (p?.role === 'creator') await loadPackages()
  }

  if (authState === 'loading') return <Shell><p className="text-center text-slate-400 py-12">Loading…</p></Shell>

  if (authState === 'anon') {
    return (
      <Shell>
        <div className="text-center py-10 space-y-4">
          <h1 className="font-display text-2xl font-bold text-slate-900">For Travel Creators</h1>
          <p className="text-slate-500 text-sm">Sign in to browse verified travel packages you can promote.</p>
          <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl">Sign in / Sign up →</Link>
        </div>
      </Shell>
    )
  }

  if (profile?.role !== 'creator') {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Register as a Travel Creator</h1>
        <p className="text-slate-500 text-sm mb-5">Browse and promote agency packages verified by Travel Baby.</p>
        <form onSubmit={register} className="space-y-3">
          <div><label className={label}>Your name</label><input className={inputCls} value={reg.full_name} onChange={e => setReg({ ...reg, full_name: e.target.value })} /></div>
          <div><label className={label}>Instagram handle *</label><input className={inputCls} value={reg.instagram_handle} onChange={e => setReg({ ...reg, instagram_handle: e.target.value })} placeholder="@wanderwithrhea" required /></div>
          <div><label className={label}>Audience size</label><input type="number" className={inputCls} value={reg.audience_size} onChange={e => setReg({ ...reg, audience_size: e.target.value })} placeholder="45000" /></div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-60">{saving ? 'Saving…' : 'Become a Creator →'}</button>
        </form>
      </Shell>
    )
  }

  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Verified packages to promote</h1>
          <p className="text-slate-500 text-sm">Curated agency trips approved by Travel Baby.</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full">Home</Link>
      </div>

      {packages.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white rounded-2xl p-8 text-center">No verified packages yet — check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {packages.map(p => <PackageCard key={p.id} p={p} />)}
        </div>
      )}
    </Shell>
  )
}

export function PackageCard({ p }: { p: AgentPackage }) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {p.image_url && <img src={p.image_url} alt="" className="w-full h-36 object-cover" />}
      <div className="p-4">
        <p className="font-bold text-slate-900 text-sm">{p.title}</p>
        <p className="text-xs text-slate-500 mb-2">{p.destination}{p.duration_days ? ` · ${p.duration_days} days` : ''}</p>
        {p.description && <p className="text-xs text-slate-600 line-clamp-2 mb-2">{p.description}</p>}
        <div className="flex items-center justify-between">
          {p.price_per_person && <span className="font-black text-green-700">₹{p.price_per_person.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/person</span></span>}
          {p.start_date && <span className="text-xs text-slate-400">{p.start_date}</span>}
        </div>
      </div>
    </div>
  )
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className={`mx-auto ${wide ? 'max-w-4xl' : 'max-w-md bg-white rounded-3xl shadow-md border border-gray-100 p-8'}`}>{children}</div>
    </main>
  )
}

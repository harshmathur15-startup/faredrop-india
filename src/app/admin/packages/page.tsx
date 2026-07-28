'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AgentPackage, PackageVerification } from '@/types/marketplace'

const TABS: PackageVerification[] = ['pending', 'verified', 'rejected']

export default function AdminPackagesPage() {
  const [secret, setSecret] = useState('')
  const [tab, setTab] = useState<PackageVerification>('pending')
  const [packages, setPackages] = useState<AgentPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load(status: PackageVerification = tab) {
    if (!secret) { alert('Enter admin password first'); return }
    setLoading(true)
    const res = await fetch(`/api/admin/packages?status=${status}`, { headers: { 'x-admin-token': secret } })
    const data = await res.json()
    setPackages(data.packages ?? [])
    setLoading(false)
  }

  async function act(id: string, patch: Record<string, unknown>) {
    setBusyId(id)
    await fetch('/api/admin/packages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': secret },
      body: JSON.stringify({ id, ...patch }),
    })
    setBusyId(null)
    load()
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">🛂 Agent Package Review</h1>
          <Link href="/admin" className="text-sm font-semibold text-gray-600 bg-white border border-gray-300 px-3 py-1.5 rounded-lg">← Deals admin</Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Admin password</label>
              <input type="password" value={secret} onChange={e => setSecret(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Required" />
            </div>
            <button onClick={() => load()} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
              {loading ? 'Loading…' : 'Load'}
            </button>
          </div>

          <div className="flex gap-2">
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); load(t) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>

          {packages.length === 0 && !loading && (
            <p className="text-center text-gray-400 text-sm py-8">No {tab} packages.</p>
          )}

          <div className="space-y-3">
            {packages.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.destination}
                      {p.price_per_person ? ` · ₹${p.price_per_person.toLocaleString('en-IN')}/person` : ''}
                      {p.duration_days ? ` · ${p.duration_days}d` : ''}
                    </p>
                    {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                    {p.inclusions && <p className="text-xs text-gray-400 mt-1">Incl: {p.inclusions}</p>}
                    {p.rejection_reason && <p className="text-xs text-red-500 mt-1">Rejected: {p.rejection_reason}</p>}
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    p.verification_status === 'verified' ? 'bg-green-100 text-green-700'
                    : p.verification_status === 'rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'}`}>
                    {p.verification_status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {p.verification_status !== 'verified' && (
                    <button onClick={() => act(p.id, { action: 'verify' })} disabled={busyId === p.id}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      ✓ Verify & publish to creators
                    </button>
                  )}
                  {p.verification_status !== 'rejected' && (
                    <button onClick={() => { const r = window.prompt('Reason (optional):') ?? undefined; act(p.id, { action: 'reject', rejection_reason: r }) }} disabled={busyId === p.id}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 disabled:opacity-50">
                      ✕ Reject
                    </button>
                  )}
                  {p.verification_status === 'verified' && (
                    <button onClick={() => act(p.id, { visible_to_travellers: !p.visible_to_travellers })} disabled={busyId === p.id}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 ${p.visible_to_travellers ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300'}`}>
                      {p.visible_to_travellers ? '👁 Visible to travellers' : '＋ Show to travellers'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

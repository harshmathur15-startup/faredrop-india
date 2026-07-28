'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AgentPackage } from '@/types/marketplace'

export default function PackagesPage() {
  const [packages, setPackages] = useState<AgentPackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then(d => { setPackages(d.packages ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Travel Packages</h1>
            <p className="text-slate-500 text-sm">Curated agency trips, verified by Travel Baby.</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full">Home</Link>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-12">Loading…</p>
        ) : packages.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white rounded-2xl p-8 text-center">No packages available right now — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow overflow-hidden">
                {p.image_url && <img src={p.image_url} alt="" className="w-full h-36 object-cover" />}
                <div className="p-4">
                  <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{p.destination}{p.duration_days ? ` · ${p.duration_days} days` : ''}</p>
                  {p.description && <p className="text-xs text-slate-600 line-clamp-2 mb-2">{p.description}</p>}
                  {p.price_per_person && (
                    <span className="font-black text-green-700">₹{p.price_per_person.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/person</span></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

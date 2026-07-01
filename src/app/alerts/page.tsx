'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AlertCard from '@/components/AlertCard'
import CreateAlertModal from '@/components/CreateAlertModal'
import NavLinks from '@/components/NavLinks'
import NavAuth from '@/components/NavAuth'
import MobileMenu from '@/components/MobileMenu'

type Alert = {
  id: string
  origin_iata: string; dest_iata: string
  origin_city: string; dest_city: string
  target_price: number
  cabin_class: string; trip_type: string
  travel_month: string | null
  is_active: boolean
  last_price_seen: number | null
  last_checked_at: string | null
  triggered_count: number
  created_at: string
}

export default function AlertsPage() {
  const router = useRouter()
  const [authed,       setAuthed]       = useState<boolean | null>(null)
  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/signup'); return }
      setAuthed(true)
      fetchAlerts()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/signup')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  async function fetchAlerts() {
    setLoading(true)
    const res = await fetch('/api/alerts')
    if (res.ok) {
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    }
    setLoading(false)
  }

  function handleCreated(alert: Record<string, unknown>) {
    setAlerts(prev => [alert as Alert, ...prev])
    setShowModal(false)
  }

  function handleUpdate(updated: Alert) {
    setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  function handleDelete(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const active  = alerts.filter(a => a.is_active)
  const paused  = alerts.filter(a => !a.is_active)

  if (authed === null) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
            <span className="font-display font-bold text-lg text-blue-900 tracking-tight hidden sm:block">Travelbaby</span>
          </Link>
          <div className="flex items-center gap-5 ml-auto">
            <NavLinks />
            <NavAuth />
            <MobileMenu />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Price Alerts</h1>
            <p className="text-gray-500 mt-1">
              We check prices every hour and notify you when they drop.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={alerts.length >= 10}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            + New alert
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 flex gap-3">
          <span className="text-xl">🔔</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">How alerts work</p>
            <p className="text-sm text-blue-700 mt-0.5">
              We monitor prices hourly. You'll get an email (and WhatsApp if enabled) when the price hits your target or drops 15%+.
              Max 10 active alerts.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <p className="text-5xl mb-4">🛫</p>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">No alerts yet</h2>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">
              Create your first price alert and we'll watch fares 24/7 so you don't have to.
            </p>
            <button onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-sm">
              Create first alert →
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active alerts */}
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Active · {active.length} / 10
                </h2>
                <div className="space-y-4">
                  {active.map(a => (
                    <AlertCard key={a.id} alert={a} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}

            {/* Paused alerts */}
            {paused.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Paused · {paused.length}
                </h2>
                <div className="space-y-4">
                  {paused.map(a => (
                    <AlertCard key={a.id} alert={a} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}

            {alerts.length >= 10 && (
              <p className="text-xs text-center text-gray-400">
                Maximum 10 active alerts reached. Pause or delete one to add more.
              </p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CreateAlertModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  )
}

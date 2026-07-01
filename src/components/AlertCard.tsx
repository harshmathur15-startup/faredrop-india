'use client'

import { useState } from 'react'

interface Alert {
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

interface Props {
  alert: Alert
  onUpdate: (updated: Alert) => void
  onDelete: (id: string) => void
}

const CABIN_LABELS: Record<string, string> = {
  economy: 'Economy', premium_economy: 'Premium Economy',
  business: 'Business', first: 'First',
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 60)  return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

export default function AlertCard({ alert, onUpdate, onDelete }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentPrice = alert.last_price_seen
  const priceDiff    = currentPrice != null ? currentPrice - alert.target_price : null
  const isBelow      = priceDiff != null && priceDiff <= 0

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/alerts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alert.id, is_active: !alert.is_active }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.alert) onUpdate(data.alert)
  }

  async function deleteAlert() {
    setLoading(true)
    await fetch(`/api/alerts?id=${alert.id}`, { method: 'DELETE' })
    onDelete(alert.id)
  }

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      alert.is_active ? 'border-gray-100 shadow-sm' : 'border-gray-200 opacity-60'
    }`}>
      {/* Status strip */}
      <div className={`h-1 rounded-t-2xl ${
        !alert.is_active ? 'bg-gray-200'
        : isBelow        ? 'bg-green-500'
        : 'bg-blue-500'
      }`} />

      <div className="p-5">
        {/* Route */}
        <div className="flex items-center gap-2 mb-3">
          <div className="text-center">
            <p className="font-black text-2xl text-slate-900 leading-none">{alert.origin_iata}</p>
            <p className="text-xs text-gray-400 mt-0.5">{alert.origin_city}</p>
          </div>
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-lg">✈️</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="text-center">
            <p className="font-black text-2xl text-slate-900 leading-none">{alert.dest_iata}</p>
            <p className="text-xs text-gray-400 mt-0.5">{alert.dest_city}</p>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {CABIN_LABELS[alert.cabin_class] ?? alert.cabin_class}
          </span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {alert.trip_type === 'roundtrip' ? 'Return' : 'One-way'}
          </span>
          {alert.travel_month && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
              {new Date(alert.travel_month + '-01').toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
          )}
          {alert.triggered_count > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
              🔔 {alert.triggered_count}× alerted
            </span>
          )}
        </div>

        {/* Price comparison */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold">Your target</p>
              <p className="font-black text-lg text-slate-900">{fmt(alert.target_price)}</p>
            </div>
            <div className="text-gray-300 text-xl">→</div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold">Last seen</p>
              {currentPrice != null ? (
                <p className={`font-black text-lg ${isBelow ? 'text-green-600' : 'text-slate-900'}`}>
                  {fmt(currentPrice)}
                  {isBelow && <span className="ml-1 text-xs">✅</span>}
                </p>
              ) : (
                <p className="text-sm text-gray-400 font-medium">Checking…</p>
              )}
            </div>
          </div>
          {priceDiff != null && (
            <p className={`text-xs mt-2 font-semibold text-center ${isBelow ? 'text-green-600' : 'text-slate-500'}`}>
              {isBelow
                ? `🎯 ${fmt(Math.abs(priceDiff))} below your target — book now!`
                : `${fmt(Math.abs(priceDiff))} above target`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Checked {timeAgo(alert.last_checked_at)}
          </p>

          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-200">
                Cancel
              </button>
              <button onClick={deleteAlert} disabled={loading}
                className="text-xs text-white bg-red-500 hover:bg-red-600 font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60">
                Confirm delete
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={toggle} disabled={loading}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                  alert.is_active
                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}>
                {loading ? '…' : alert.is_active ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

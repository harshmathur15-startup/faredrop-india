'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserTier, useUnlocks } from '@/lib/useAuth'
import { formatDateRange } from '@/lib/utils'
import FlightDetails from './FlightDetails'

// Member-only section of the deal page. The server renders NONE of this data;
// it's fetched here from the entitlement-checked API, so guests / search bots /
// no-JS clients never receive the exact dates, airline, legs or booking link.
interface ProtectedDeal {
  airline: string
  validity_start: string
  validity_end: string
  trip: 'oneway' | 'roundtrip'
  cabin: string
  stops: number | null
  note: string
  google_url: string
}

type Status = 'loading' | 'guest' | 'locked' | 'ready' | 'error'

const card = 'mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-center'
const btn = 'block w-full text-center font-bold py-3.5 rounded-xl transition-colors'

export default function DealDetails({ dealId }: { dealId: string }) {
  const { authed } = useUserTier()
  const { state, unlock } = useUnlocks()
  const router = useRouter()
  const [data, setData] = useState<ProtectedDeal | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    // No synchronous setState here — status starts 'loading', and callers that
    // re-run load (retry / post-unlock) set 'loading' themselves in their handler.
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      const res = await fetch(`/api/deal/${dealId}/details`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })
      if (res.status === 401) return setStatus('guest')
      if (res.status === 403) return setStatus('locked')
      if (!res.ok) return setStatus('error')
      const j = await res.json()
      if (j?.entitled && j.deal) { setData(j.deal as ProtectedDeal); setStatus('ready') }
      else setStatus(j?.reason === 'guest' ? 'guest' : 'locked')
    } catch { setStatus('error') }
  }, [dealId])

  useEffect(() => {
    if (authed === undefined) return // wait until auth state resolves
    // Fetch-on-mount of the entitlement-gated details; load() only setStates after
    // an await, never synchronously in this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [authed, load])

  const credits = state?.credits ?? 0
  const doUnlock = async () => {
    if (credits <= 0) { router.push('/pricing'); return }
    setBusy(true)
    const res = await unlock(dealId)
    setBusy(false)
    if (res.ok) { setStatus('loading'); await load() }
    else if (res.reason === 'no_credits') router.push('/pricing')
  }

  if (status === 'loading') {
    return <div className="mt-5 h-40 rounded-2xl border border-slate-100 bg-white animate-pulse" />
  }

  if (status === 'guest') {
    return (
      <div className={card}>
        <p className="text-3xl mb-2">🔒</p>
        <h2 className="font-display text-lg font-bold text-slate-900">Sign up free to see the full deal</h2>
        <p className="text-gray-500 text-sm mt-1 mb-4">Reveal the exact travel dates, airline &amp; booking link. 3 free unlocks every month — no card.</p>
        <Link href="/signup" className={`${btn} bg-blue-600 hover:bg-blue-700 text-white`}>Sign up free →</Link>
      </div>
    )
  }

  if (status === 'locked') {
    return (
      <div className={card}>
        <p className="text-3xl mb-2">🔒</p>
        <h2 className="font-display text-lg font-bold text-slate-900">Unlock this deal</h2>
        {credits > 0 ? (
          <>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Reveal the exact dates, airline &amp; booking link. You have{' '}
              <strong className="text-blue-700">{credits} free unlock{credits === 1 ? '' : 's'}</strong> left this month.
            </p>
            <button onClick={doUnlock} disabled={busy}
              className={`${btn} bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white`}>
              {busy ? 'Unlocking…' : '🔓 Unlock this deal (1 credit)'}
            </button>
            <Link href="/pricing" className="block mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
              Or upgrade for unlimited unlocks →
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mt-1 mb-4">You&apos;ve used all your free unlocks this month. Upgrade for unlimited access — or they refresh next month.</p>
            <Link href="/pricing" className={`${btn} bg-amber-500 hover:bg-amber-600 text-white`}>Upgrade →</Link>
          </>
        )}
      </div>
    )
  }

  if (status === 'error' || !data) {
    return (
      <div className={card}>
        <p className="text-gray-500 text-sm mb-3">Couldn&apos;t load the deal details.</p>
        <button onClick={() => { setStatus('loading'); load() }} className={`${btn} bg-slate-800 hover:bg-slate-900 text-white`}>Try again</button>
      </div>
    )
  }

  // Entitled — render the member-only details.
  const dates = formatDateRange(data.validity_start, data.validity_end)
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p className="font-semibold text-gray-900">Travel dates</p>
          <p>{dates}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Airline</p>
          <p>{data.airline}</p>
        </div>
      </div>

      <FlightDetails note={data.note} />

      <div className="mt-5">
        <a href={data.google_url} target="_blank" rel="noopener noreferrer"
          className={`${btn} bg-blue-600 hover:bg-blue-700 text-white text-lg py-4`}>
          🔍 Search on Google Flights ({dates}) →
        </a>
      </div>
      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 text-center">
        Prices may vary — search quickly as fares change.
      </p>
    </div>
  )
}

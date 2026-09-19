'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserTier, useUnlocks } from '@/lib/useAuth'

// Gates the deal detail page under the unlock-credits model:
// - Guest              → redirect to /signup
// - Paid (silver/gold) → full access
// - Free + unlocked    → full access
// - Free + NOT unlocked → cover the page with an "Unlock (1 credit)" prompt
//   (spends a credit via the unlock_deal RPC; when out of credits → upgrade)
export default function DealGate({ dealId }: { dealId: string }) {
  const { authed, tier } = useUserTier()
  const { state, unlock } = useUnlocks()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authed === false) router.replace('/signup')
  }, [authed, router])

  // Still resolving, or a guest being redirected → render nothing.
  if (authed === undefined || authed === false || tier === undefined || tier === null) return null

  const isPaid = tier === 'silver' || tier === 'gold'
  if (isPaid) return null

  // Free user — wait for unlock state, then either reveal (unlocked) or gate.
  if (state === undefined) return null
  if (state.unlocked.has(dealId)) return null

  const credits = state.credits
  const doUnlock = async () => {
    if (credits <= 0) { router.push('/pricing'); return }
    setBusy(true)
    const res = await unlock(dealId)
    setBusy(false)
    if (!res.ok && res.reason === 'no_credits') router.push('/pricing')
    // Success → useUnlocks updates state → this component returns null → page revealed.
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/85 backdrop-blur-sm p-5">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full text-center p-8">
        <p className="text-4xl mb-3">🔒</p>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Unlock this deal</h2>
        {credits > 0 ? (
          <>
            <p className="text-gray-500 text-sm mb-5">
              Reveal the exact dates &amp; booking link. You have{' '}
              <strong className="text-blue-700">{credits} free unlock{credits === 1 ? '' : 's'}</strong> left this month.
            </p>
            <button onClick={doUnlock} disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
              {busy ? 'Unlocking…' : '🔓 Unlock this deal (1 credit)'}
            </button>
            <Link href="/pricing" className="block mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
              Or upgrade for unlimited unlocks →
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-5">
              You&apos;ve used all your free unlocks this month. Upgrade for unlimited access — or they refresh next month.
            </p>
            <Link href="/pricing" className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
              Upgrade →
            </Link>
            <Link href="/#deals" className="block mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700">
              ← Back to deals
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

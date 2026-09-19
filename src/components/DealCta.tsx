'use client'

import Link from 'next/link'
import { useUserTier, useUnlocks } from '@/lib/useAuth'

// Primary booking CTA on the deal page. The real Google Flights link is shown only
// to entitled users: paid subscribers, or free users who have unlocked THIS deal
// (spent a credit). Guests are nudged to sign up. Free users who haven't unlocked
// are normally covered by the <DealGate> overlay; this is the safe fallback.
export default function DealCta({
  googleUrl,
  label,
  dealId,
}: {
  googleUrl: string
  label: string
  dealId: string
}) {
  const { authed, tier } = useUserTier()
  const { state } = useUnlocks()
  const base = 'block w-full text-center font-bold py-4 rounded-xl transition-colors text-lg'

  // Auth / entitlement still resolving — neutral placeholder (avoids leaking the link on flash).
  if (authed === undefined || (authed && tier === undefined) || (authed && state === undefined)) {
    return <div className={`${base} bg-blue-600/50 text-white animate-pulse`}>Loading…</div>
  }

  // Guest — build desire first, gate the booking link behind a free sign-up.
  if (authed === false) {
    return (
      <Link href="/signup" className={`${base} bg-blue-600 hover:bg-blue-700 text-white`}>
        Sign up free to unlock the booking link →
      </Link>
    )
  }

  const isPaid = tier === 'silver' || tier === 'gold'
  const entitled = isPaid || (state?.unlocked.has(dealId) ?? false)

  // Entitled — the real booking link.
  if (entitled) {
    return (
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={`${base} bg-blue-600 hover:bg-blue-700 text-white`}>
        {label}
      </a>
    )
  }

  // Free user who hasn't unlocked this deal.
  return (
    <Link href="/pricing" className={`${base} bg-amber-500 hover:bg-amber-600 text-white`}>
      Unlock this deal to book →
    </Link>
  )
}

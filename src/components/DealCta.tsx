'use client'

import Link from 'next/link'
import { useUserTier } from '@/lib/useAuth'

// Primary booking CTA on the deal page. Guests can see the deal, but the real
// Google Flights booking link is gated behind a free sign-up; free users on a
// premium deal are nudged to upgrade. Entitled users get the live link.
export default function DealCta({
  googleUrl,
  label,
  isPremium,
}: {
  googleUrl: string
  label: string
  isPremium: boolean
}) {
  const { authed, tier } = useUserTier()
  const base = 'block w-full text-center font-bold py-4 rounded-xl transition-colors text-lg'

  // Auth still resolving — neutral placeholder (avoids a wrong-state flash).
  if (authed === undefined || (authed && tier === undefined)) {
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

  // Signed-in free user on a premium deal — upgrade to unlock.
  if (isPremium && tier === 'free') {
    return (
      <Link href="/pricing" className={`${base} bg-amber-500 hover:bg-amber-600 text-white`}>
        Upgrade to unlock this deal →
      </Link>
    )
  }

  // Entitled — the real booking link.
  return (
    <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={`${base} bg-blue-600 hover:bg-blue-700 text-white`}>
      {label}
    </a>
  )
}

'use client'

import Link from 'next/link'
import { useUserTier, useUnlocks } from '@/lib/useAuth'

// Gates ONLY the exact travel dates on the deal page. Everyone can see the deal
// itself (price, route, airline, routing); the dates reveal with entitlement:
//   - paid or already-unlocked  → show the dates
//   - guest                     → "Sign up free to see dates" (→ /signup)
//   - free, not yet unlocked    → neutral lock hint (the DealCta / unlock flow
//                                 drives the actual credit spend)
// Mirrors how the homepage storefront already teases guests with prices but not dates.
export default function GatedDates({ dealId, dates }: { dealId: string; dates: string }) {
  const { authed, tier } = useUserTier()
  const { state } = useUnlocks()

  // Still resolving — avoid flashing the dates before we know entitlement.
  if (authed === undefined || (authed && tier === undefined) || (authed && state === undefined)) {
    return <span className="text-gray-300">·····</span>
  }

  const isPaid = authed === true && (tier === 'silver' || tier === 'gold')
  const entitled = isPaid || (state?.unlocked.has(dealId) ?? false)
  if (entitled) return <span>{dates}</span>

  if (authed === false) {
    return (
      <Link href="/signup" className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline">
        🔒 Sign up free to see dates
      </Link>
    )
  }

  // Signed-in free user who hasn't unlocked this deal yet.
  return <span className="text-gray-400">🔒 Unlock to reveal</span>
}

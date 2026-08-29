'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserTier } from '@/lib/useAuth'

// Placed on the deal detail page. Only PREMIUM deals are gated here; free
// deals are viewable by anyone (guests included) to build desire — the booking
// link itself is gated in <DealCta>, so first-time visitors see the deal
// before being asked to sign up.
// - Premium deal + not logged in → redirect to /signup
// - Premium deal + free user     → redirect to /pricing
export default function DealGate({ isPremium }: { isPremium: boolean }) {
  const { authed, tier } = useUserTier()
  const router = useRouter()

  useEffect(() => {
    if (!isPremium) return // free deals: viewable by all; DealCta gates booking
    if (authed === false) { router.replace('/signup'); return }
    if (authed === true && tier === 'free') router.replace('/pricing')
  }, [authed, tier, isPremium, router])

  return null
}

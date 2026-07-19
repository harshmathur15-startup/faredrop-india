'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserTier } from '@/lib/useAuth'

// Placed on the deal detail page.
// - Not logged in → redirect to /signup
// - Free user on a premium deal → redirect to /pricing
export default function DealGate({ isPremium }: { isPremium: boolean }) {
  const { authed, tier } = useUserTier()
  const router = useRouter()

  useEffect(() => {
    if (authed === false) { router.replace('/signup'); return }
    if (authed === true && tier != null) {
      if (isPremium && tier === 'free') router.replace('/pricing')
    }
  }, [authed, tier, isPremium, router])

  return null
}

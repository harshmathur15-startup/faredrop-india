'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthed } from '@/lib/useAuth'

// Placed on the deal detail page: bounces signed-out visitors into the signup journey.
export default function DealGate() {
  const authed = useAuthed()
  const router = useRouter()
  useEffect(() => {
    if (authed === false) router.replace('/signup')
  }, [authed, router])
  return null
}

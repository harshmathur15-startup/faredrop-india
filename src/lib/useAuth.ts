'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Returns: undefined while checking, true if signed in, false if signed out.
export function useAuthed(): boolean | undefined {
  const [authed, setAuthed] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])
  return authed
}

export type UserTier = 'free' | 'silver' | 'gold'

// Returns auth state + subscription tier.
// authed=undefined while loading; tier=undefined while loading; tier=null when signed out.
export function useUserTier(): { authed: boolean | undefined; tier: UserTier | null | undefined } {
  const [authed, setAuthed] = useState<boolean | undefined>(undefined)
  const [tier, setTier]     = useState<UserTier | null | undefined>(undefined)

  useEffect(() => {
    async function loadTier(userId: string) {
      const { data } = await supabase
        .from('user_preferences')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single()
      setTier((data?.subscription_tier as UserTier | undefined) ?? 'free')
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setAuthed(false); setTier(null); return }
      setAuthed(true)
      loadTier(data.session.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setAuthed(false); setTier(null); return }
      setAuthed(true)
      loadTier(session.user.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { authed, tier }
}

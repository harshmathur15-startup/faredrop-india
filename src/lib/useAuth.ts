'use client'

import { useCallback, useEffect, useState } from 'react'
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

export interface UnlockState {
  credits: number          // remaining unlock credits this month (effective)
  unlocked: Set<string>    // deal ids this user has permanently unlocked
}

// Unlock-credits wallet for the signed-in user. Reads get_unlock_state() once,
// and exposes unlock(dealId) which spends a credit via the unlock_deal RPC.
// state === undefined while loading; credits/unlocked are 0/empty for signed-out.
export function useUnlocks(): {
  state: UnlockState | undefined
  unlock: (dealId: string) => Promise<{ ok: boolean; reason?: string; credits: number }>
} {
  const [state, setState] = useState<UnlockState | undefined>(undefined)

  useEffect(() => {
    async function loadState() {
      const { data } = await supabase.rpc('get_unlock_state')
      setState({
        credits: data?.credits ?? 0,
        unlocked: new Set<string>((data?.unlocked as string[] | undefined) ?? []),
      })
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setState({ credits: 0, unlocked: new Set() }); return }
      loadState()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setState({ credits: 0, unlocked: new Set() }); return }
      loadState()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const unlock = useCallback(async (dealId: string) => {
    const { data } = await supabase.rpc('unlock_deal', { p_deal_id: dealId })
    const credits = data?.credits ?? 0
    if (data?.ok) {
      setState(prev => ({ credits, unlocked: new Set([...(prev?.unlocked ?? []), dealId]) }))
      return { ok: true, credits }
    }
    return { ok: false, reason: data?.reason as string | undefined, credits }
  }, [])

  return { state, unlock }
}

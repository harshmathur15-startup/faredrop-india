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

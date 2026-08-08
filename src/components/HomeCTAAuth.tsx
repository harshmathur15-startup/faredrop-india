'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export function HomeCTAButtons() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loggedIn === null) return null
  if (loggedIn) {
    return (
      <Link href="#deals" className="bg-white text-blue-800 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-colors">
        Browse deals
      </Link>
    )
  }
  return (
    <>
      <Link href="/signup" className="bg-white text-blue-800 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-colors">Sign up free</Link>
      <Link href="/login" className="bg-white/10 border border-white/40 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">Log in</Link>
    </>
  )
}

export function FooterAuthLink() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loggedIn === null) return null
  if (loggedIn) {
    return <Link href="/account" className="block hover:text-white transition-colors">My account</Link>
  }
  return <Link href="/signup" className="block hover:text-white transition-colors">Login / Sign up</Link>
}

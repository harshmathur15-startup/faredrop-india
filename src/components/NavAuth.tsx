'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NavAuth() {
  // undefined = still checking, null = logged out, string = display name
  const [name, setName] = useState<string | null | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    type Session = { user?: { email?: string; user_metadata?: Record<string, unknown> } } | null
    function apply(session: Session) {
      const u = session?.user
      if (!u) { setName(null); return }
      const n = (u.user_metadata?.full_name as string)
        || (u.user_metadata?.name as string)
        || u.email?.split('@')[0]
        || 'Account'
      setName(n)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => apply(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (name === undefined) return null // brief loading, render nothing
  if (!name) {
    return <Link href="/signup" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors">Login</Link>
  }

  const first = name.split(' ')[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-700">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          {first[0]?.toUpperCase()}
        </span>
        Hi, {first}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
            <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">My profile</Link>
            <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Log out</button>
          </div>
        </>
      )}
    </div>
  )
}

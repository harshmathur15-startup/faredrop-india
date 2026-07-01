'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const AUTHED_LINKS = [
  { href: '/#deals',      label: 'Deals',       color: 'text-gray-700' },
  { href: '/alerts',      label: '🔔 Alerts',   color: 'text-blue-600' },
  { href: '/about',       label: 'About',       color: 'text-gray-700' },
  { href: '/pricing',     label: 'Pricing',     color: 'text-gray-700' },
  { href: '/for-creators',label: 'For Creators',color: 'text-purple-600' },
  { href: '/for-agents',  label: 'For Agents',  color: 'text-indigo-600' },
]

const GUEST_LINKS = [
  { href: '/about', label: 'About', color: 'text-gray-700' },
  { href: '/pricing', label: 'Pricing', color: 'text-gray-700' },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    type Session = { user?: { email?: string; user_metadata?: Record<string, unknown> } } | null
    function apply(session: Session) {
      const u = session?.user
      if (!u) { setName(null); return }
      setName((u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Account')
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => apply(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const links = name ? AUTHED_LINKS : GUEST_LINKS

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-800"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-800"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[60px] bg-black/20 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50 px-5 py-3">
            <div className="flex flex-col">
              {/* Signed-in header */}
              {name && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                  <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {name[0]?.toUpperCase()}
                  </span>
                  <span className="font-bold text-slate-900">Hi, {name.split(' ')[0]}</span>
                </div>
              )}

              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`py-3 text-base font-semibold border-b border-gray-100 ${l.color}`}>
                  {l.label}
                </Link>
              ))}

              {/* Auth actions */}
              {name === undefined ? null : name ? (
                <>
                  <Link href="/account" onClick={() => setOpen(false)} className="py-3 text-base font-semibold border-b border-gray-100 text-gray-700">My profile</Link>
                  <button onClick={logout} className="py-3 text-left text-base font-semibold text-red-600">Log out</button>
                </>
              ) : (
                <Link href="/signup" onClick={() => setOpen(false)} className="py-3 text-base font-bold text-blue-700">Login / Sign up</Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

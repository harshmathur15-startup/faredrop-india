'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function MarketplaceHeroTabs() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <div className="max-w-xl mx-auto">
      <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed mb-5 max-w-xl mx-auto">
        Set your home airport and travel preferences. We&apos;ll send you curated international flight deals worth booking.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {loggedIn ? (
          <Link
            href="#deals"
            className="bg-white hover:bg-blue-50 text-blue-700 shadow-md font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Browse deals
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="bg-white hover:bg-blue-50 text-blue-700 shadow-md font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              Sign up to get alerts
            </Link>
            <Link
              href="/login"
              className="bg-transparent hover:bg-white/25 text-blue-800 border border-blue-700/50 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

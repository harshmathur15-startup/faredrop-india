'use client'

import Link from 'next/link'
import { useAuthed } from '@/lib/useAuth'

// "Can't find your deal?" CTA — only shown to signed-in customers.
export default function RequestDealCta() {
  const authed = useAuthed()
  if (authed !== true) return null

  return (
    <section className="max-w-6xl mx-auto px-5 pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl px-8 py-10 text-center shadow-lg">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Can&apos;t find your deal?</h3>
        <p className="text-blue-100 mb-6 max-w-lg mx-auto">
          Tell us where and when you want to fly — our team will hunt for the best fare and email it straight to you.
        </p>
        <Link href="/request-deal" className="inline-block bg-white text-blue-700 hover:bg-blue-50 font-bold px-7 py-3.5 rounded-xl transition-colors">
          Request a deal →
        </Link>
      </div>
    </section>
  )
}

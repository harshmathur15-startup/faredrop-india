'use client'

import Link from 'next/link'
import { useAuthed } from '@/lib/useAuth'

export default function NavLinks() {
  const authed = useAuthed()
  if (authed === undefined) return null

  if (!authed) {
    return (
      <>
        <Link href="/about" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">About</Link>
        <Link href="/pricing" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Pricing</Link>
        <Link href="/signup" className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors hidden sm:block">Sign up free</Link>
      </>
    )
  }

  return (
    <>
      <a href="/#deals" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Deals</a>
      <Link href="/alerts" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors hidden sm:block">🔔 Alerts</Link>
      <Link href="/about" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">About</Link>
      <Link href="/pricing" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors hidden sm:block">Pricing</Link>
      <Link href="/for-creators" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors hidden sm:block">For Creators</Link>
      <Link href="/for-agents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:block">For Agents</Link>
    </>
  )
}

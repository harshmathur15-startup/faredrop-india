'use client'

import Link from 'next/link'
import { useAuthed } from '@/lib/useAuth'

export default function DealLink({ dealId, className, children }: {
  dealId: string; className?: string; children: React.ReactNode
}) {
  const authed = useAuthed()

  if (authed === true) {
    return <Link href={`/deal/${dealId}`} className={className}>{children}</Link>
  }

  // signed out (or still checking): show card as non-clickable div.
  // When signed out, a "Sign up to view →" CTA fades in on hover.
  return (
    <div className={`${className ?? ''} relative`}>
      {children}
      {authed === false && (
        <Link
          href="/signup"
          className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
        >
          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
            🔒 Sign up to view →
          </span>
        </Link>
      )}
    </div>
  )
}

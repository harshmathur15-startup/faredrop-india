'use client'

import Link from 'next/link'

// Always renders as a clickable link to /deal/[id].
// DealGate on the deal page handles redirecting unauthenticated users to /signup.
export default function DealLink({ dealId, className, children }: {
  dealId: string; className?: string; children: React.ReactNode
}) {
  return <Link href={`/deal/${dealId}`} className={className}>{children}</Link>
}

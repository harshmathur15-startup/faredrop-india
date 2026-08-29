'use client'

import Link from 'next/link'

// Always renders as a clickable link to /deal/[id].
// DealGate on the deal page handles redirecting unauthenticated users to /signup.
// The data-* attributes are read by <DealTracker> for impression + click analytics.
export default function DealLink({ dealId, surface, position, className, children }: {
  dealId: string
  surface?: string
  position?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={`/deal/${dealId}`}
      className={className}
      data-deal-id={dealId}
      data-surface={surface}
      data-position={position}
    >
      {children}
    </Link>
  )
}

'use client'

import { useRouter } from 'next/navigation'

// "Back to deals" that returns the user to where they were in the deals grid.
// Real browser-back restores scroll position; if the deal page was opened
// directly (shared link, no in-app history), fall back to the deals section.
export default function BackToDeals() {
  const router = useRouter()

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/#deals')
    }
  }

  return (
    <button
      onClick={goBack}
      className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline py-2 -my-2"
    >
      <span aria-hidden>←</span> Back to deals
    </button>
  )
}

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Deal } from '@/types'
import { formatPrice, calcDiscount } from '@/lib/utils'

function DealCard({ deal }: { deal: Deal }) {
  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const tierColor = discount >= 70 ? 'bg-purple-500' : discount >= 50 ? 'bg-green-500' : 'bg-blue-500'
  const tierLabel = discount >= 70 ? '🔥 Exceptional' : discount >= 50 ? '⚡ Great deal' : '👍 Good deal'

  return (
    <Link
      href={`/deal/${deal.id}`}
      className="group flex-shrink-0 w-72 bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image src={deal.image_url} alt={deal.dest_city} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Discount badge */}
        <div className={`absolute top-3 left-3 ${tierColor} text-white text-sm font-black px-3 py-1 rounded-full shadow`}>
          {discount}% OFF
        </div>

        {/* Route on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white/80 text-xs font-medium">{deal.origin_city} → {deal.dest_city}</p>
          <p className="text-white text-lg font-black">{deal.dest_city}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{deal.airline}</span>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{tierLabel}</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-black text-gray-900">{formatPrice(deal.deal_price, deal.currency)}</span>
          <span className="text-sm text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          {new Date(deal.validity_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(deal.validity_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{deal.curator_note?.slice(0, 45)}...</span>
          <span className="text-blue-600 text-xs font-bold group-hover:underline shrink-0 ml-2">View →</span>
        </div>
      </div>
    </Link>
  )
}

export default function DealCarousel({ deals }: { deals: Deal[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  function onScroll() {
    if (!scrollRef.current) return
    setCanScrollLeft(scrollRef.current.scrollLeft > 10)
    setCanScrollRight(scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10)
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <Image src="/travel-baby-logo.png" alt="Travelbaby" width={80} height={80} className="h-20 w-auto drop-shadow mx-auto mb-3" />
        <p className="text-gray-700 font-semibold text-lg">Our falcon is hunting for deals!</p>
        <p className="text-gray-400 text-sm mt-1">New deals drop every week. Sign up above to be first.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button onClick={() => scroll('left')}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200 transition-all">
          ←
        </button>
      )}

      {/* Cards */}
      <div ref={scrollRef} onScroll={onScroll}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
      </div>

      {/* Right arrow */}
      {canScrollRight && deals.length > 3 && (
        <button onClick={() => scroll('right')}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200 transition-all">
          →
        </button>
      )}
    </div>
  )
}

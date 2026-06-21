'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Deal } from '@/types'
import { formatPrice, calcDiscount } from '@/lib/utils'

// Curated Unsplash photos per destination (no API key needed)
const CITY_IMAGES: Record<string, string> = {
  // SE Asia
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  DMK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  CMB: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&h=600&fit=crop',
  DPS: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  SIN: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&h=600&fit=crop',
  KUL: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  HKT: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop',
  HAN: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&h=600&fit=crop',
  SGN: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop',
  RGN: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop',
  // East Asia
  NRT: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  HND: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  ICN: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop',
  HKG: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=800&h=600&fit=crop',
  PEK: 'https://images.unsplash.com/photo-1508804052814-cd3ba865a116?w=800&h=600&fit=crop',
  // Middle East
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  AUH: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
  DOH: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
  // Indian Ocean
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
  SEZ: 'https://images.unsplash.com/photo-1505881402582-c5bc11054f91?w=800&h=600&fit=crop',
  // Europe
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  AMS: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  FCO: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
  BCN: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
  ZRH: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop',
  // Americas
  JFK: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  LAX: 'https://images.unsplash.com/photo-1580655653885-65763b2597d1?w=800&h=600&fit=crop',
  // Africa
  NBO: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=600&fit=crop',
  // Australia
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  MEL: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&h=600&fit=crop',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop'

function getDealImage(deal: Deal): string {
  const url = deal.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[deal.dest_iata] ?? FALLBACK_IMAGE
}

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
        <Image src={getDealImage(deal)} alt={deal.dest_city} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
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

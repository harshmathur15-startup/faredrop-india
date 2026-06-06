import Link from 'next/link'
import Image from 'next/image'
import { Deal } from '@/types'
import { formatPrice, calcDiscount, formatDateRange } from '@/lib/utils'

export default function DealCard({ deal }: { deal: Deal }) {
  const discount = calcDiscount(deal.normal_price, deal.deal_price)

  return (
    <Link href={`/deal/${deal.id}`} className="group block rounded-2xl overflow-hidden bg-white shadow hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
      {/* Destination image */}
      <div className="relative h-44 w-full">
        <Image
          src={deal.image_url}
          alt={deal.dest_city}
          fill
          className="object-cover"
        />
        {/* Discount badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-white font-black text-lg px-2.5 py-1 rounded-xl shadow-lg leading-none">
          {discount}%<br />
          <span className="text-xs font-semibold">OFF</span>
        </div>
        {/* Route overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <p className="text-white font-bold text-base leading-tight">
            {deal.origin_city} → {deal.dest_city}
          </p>
          <p className="text-white/70 text-xs">{deal.airline}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-gray-900">{formatPrice(deal.deal_price, deal.currency)}</p>
            <p className="text-sm text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {deal.origin_iata} → {deal.dest_iata}
          </span>
        </div>

        {/* Validity */}
        <p className="text-xs text-gray-400 mt-2">
          Book by: {formatDateRange(deal.validity_start, deal.validity_end)}
        </p>

        {/* Curator note */}
        {deal.curator_note && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">&ldquo;{deal.curator_note}&rdquo;</p>
        )}

        {/* CTA hint */}
        <div className="mt-3 flex items-center text-blue-600 text-xs font-semibold">
          View deal <span className="ml-1">→</span>
        </div>
      </div>
    </Link>
  )
}

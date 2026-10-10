import Link from 'next/link'
import Image from 'next/image'
import { Deal } from '@/types'
import { formatPrice, calcDiscount, cabinFromNote, tripFromNote } from '@/lib/utils'
import { dealImage } from '@/lib/routes'

// Teaser card for /flights/[route] landing pages.
// Deliberately GATED: shows route, price, discount & airline (enough to rank &
// entice) but NEVER the exact travel dates or booking link — those stay behind
// the signup gate. Links to /deal/[id]; anonymous click-through hits DealGate,
// which redirects to /signup. Dates/booking are omitted from the markup entirely,
// so they never reach the client or search crawlers.
export default function RouteDealCard({ deal, position }: { deal: Deal; position?: number }) {
  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const cabin = cabinFromNote(deal.curator_note)
  const oneWay = tripFromNote(deal.curator_note) === 'oneway'
  const arrow = oneWay ? '→' : '⇄'

  return (
    <Link
      href={`/deal/${deal.id}`}
      className="group block rounded-2xl overflow-hidden bg-white shadow hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
      data-deal-id={deal.id}
      data-surface="route"
      data-position={position}
    >
      {/* Destination image */}
      <div className="relative h-44 w-full">
        <Image src={dealImage(deal)} alt={deal.dest_city} fill className="object-cover" />
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white font-black text-lg px-2.5 py-1 rounded-xl shadow-lg leading-none">
            {discount}%<br />
            <span className="text-xs font-semibold">OFF</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <p className="text-white font-bold text-base leading-tight">
            {deal.origin_city} {arrow} {deal.dest_city}
          </p>
          <p className="text-white/70 text-xs flex items-center gap-1.5">
            {deal.airline}
            {cabin && (
              <span className="bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                {cabin}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Body — price visible, dates gated */}
      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-gray-900">{formatPrice(deal.deal_price, deal.currency)}</p>
            <p className="text-sm text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</p>
            <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
              {oneWay ? '✈ One way' : '✈ Round trip fare'}
            </p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {deal.origin_iata} {arrow} {deal.dest_iata}
          </span>
        </div>

        {/* Gated dates */}
        <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <span className="text-sm">🔒</span>
          <span className="text-sm text-gray-500 select-none">Sign up free to see dates &amp; book</span>
        </div>

        <div className="mt-3 flex items-center text-blue-600 text-xs font-semibold group-hover:text-blue-700">
          View deal <span className="ml-1">→</span>
        </div>
      </div>
    </Link>
  )
}

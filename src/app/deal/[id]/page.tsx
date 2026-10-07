import { supabase } from '@/lib/supabase'
import type { Deal } from '@/types'
import { toPublicDeal } from '@/lib/deal-access'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatPrice, calcDiscount } from '@/lib/utils'
import Link from 'next/link'
import DealDetails from '@/components/DealDetails'
import BackToDeals from '@/components/BackToDeals'
import NavAuth from '@/components/NavAuth'
import MobileMenu from '@/components/MobileMenu'

const CITY_IMAGES: Record<string, string> = {
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  DPS: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  SIN: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&h=600&fit=crop',
  KUL: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  HKT: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop',
  HAN: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&h=600&fit=crop',
  NRT: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  HND: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  ICN: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop',
  HKG: 'https://images.pexels.com/photos/26970225/pexels-photo-26970225.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  JFK: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  DOH: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
  PVG: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
  SHA: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
  KTM: 'https://images.pexels.com/photos/11505263/pexels-photo-11505263.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
}
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop'
function getDealImage(d: { image_url?: string | null; dest_iata: string }) {
  const url = d.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[d.dest_iata] ?? FALLBACK_IMAGE
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return {}
  const { data: deal } = await supabase
    .from('deals')
    .select('id, origin_city, dest_city, dest_iata, image_url, deal_price, normal_price, currency, status')
    .eq('id', id)
    .single()
  if (!deal || deal.status !== 'published') return {}

  // PUBLIC metadata only — route, price, discount. No curator_note / exact dates /
  // airline. Deal pages are noindex (ephemeral); the homepage is the indexed anchor.
  const price = formatPrice(deal.deal_price, deal.currency)
  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const title = `${deal.origin_city} → ${deal.dest_city} flights from ${price}`
  const description = `Save ${discount}% on ${deal.origin_city} → ${deal.dest_city} flights. Sign up free on Travelbaby to unlock the exact dates, airline & booking link.`
  const image = getDealImage(deal)
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/deal/${id}` },
    openGraph: { title, description, images: [image], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound()
  const { data: row } = await supabase.from('deals').select('*').eq('id', id).single<Deal>()
  if (!row || row.status !== 'published') notFound()

  // Project to PUBLIC fields before ANYTHING is rendered. The exact dates, airline,
  // flight legs and booking link are never emitted in this server response — they
  // load via <DealDetails> from the entitlement-checked API, only for members.
  const deal = toPublicDeal(row)
  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const oneWay = deal.trip === 'oneway'

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={40} height={40} className="h-10 w-auto" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block"><NavAuth /></div>
          <MobileMenu />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-16">
        <BackToDeals />

        <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="relative h-64 w-full">
            <Image src={getDealImage(deal)} alt={deal.dest_city} fill className="object-cover" />
            <span className="absolute top-4 left-4 bg-green-500 text-white text-lg font-bold px-3 py-1 rounded-full">
              {discount}% off
            </span>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              {oneWay
                ? `${deal.origin_iata}–${deal.dest_iata} · ${deal.origin_city} → ${deal.dest_city}`
                : `${deal.origin_iata}–${deal.dest_iata}–${deal.origin_iata} · ${deal.origin_city} ↔ ${deal.dest_city}`}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.origin_city} → {deal.dest_city}</h1>

            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-4xl font-extrabold text-green-600">{formatPrice(deal.deal_price, deal.currency)}</span>
              <span className="text-lg text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
            </div>
            <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              {oneWay ? '✈ One way fare · single journey' : '✈ Round trip fare · both ways included'}
            </span>

            {deal.cabin !== 'Economy' && (
              <div className="mt-4 flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <span className="text-violet-500 text-lg mt-0.5">✦</span>
                <p className="text-sm text-violet-800 font-medium">
                  This is a <strong>{deal.cabin}</strong> deal.
                </p>
              </div>
            )}

            {/* Member-only: exact dates, airline, flight details & booking link */}
            <DealDetails dealId={deal.id} />

            <p className="text-xs text-gray-400 text-center mt-4">
              Prices may change. Always verify before booking.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

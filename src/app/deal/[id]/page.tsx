import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPrice, calcDiscount, formatDateRange } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return {}
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) return {}
  return {
    title: `${deal.origin_city} → ${deal.dest_city} for ${formatPrice(deal.deal_price, deal.currency)} | FareDrop India`,
    description: deal.curator_note,
    openGraph: { images: [deal.image_url] },
  }
}

function buildGoogleFlightsUrl(deal: Deal): string {
  const dept = deal.validity_start
  const ret = deal.validity_end
  // Deep link format with origin, destination and dates pre-filled
  return `https://www.google.com/travel/flights?hl=en&gl=in#flt=${deal.origin_iata}.${deal.dest_iata}.${dept}*${deal.dest_iata}.${deal.origin_iata}.${ret};c:INR;e:1;sd:1`
}

function sourceLabel(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    if (host.includes('indigo')) return 'Book on IndiGo'
    if (host.includes('airindia')) return 'Book on Air India'
    if (host.includes('emirates')) return 'Book on Emirates'
    if (host.includes('qatarairways')) return 'Book on Qatar Airways'
    if (host.includes('airasia')) return 'Book on AirAsia'
    if (host.includes('makemytrip')) return 'Book on MakeMyTrip'
    if (host.includes('cleartrip')) return 'Book on Cleartrip'
    if (host.includes('ixigo')) return 'Book on Ixigo'
    if (host.includes('easemytrip')) return 'Book on EaseMyTrip'
    if (host.includes('google')) return null // handled separately
    return `Book on ${host}`
  } catch {
    return 'Book this deal'
  }
}

function isGoogleUrl(url: string): boolean {
  try { return new URL(url).hostname.includes('google') } catch { return false }
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound()
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single<Deal>()

  if (!deal || deal.status !== 'published') notFound()

  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const googleFlightsUrl = buildGoogleFlightsUrl(deal)
  const bookingLabel = sourceLabel(deal.source_url)
  const sourceIsGoogle = isGoogleUrl(deal.source_url)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-600 text-sm hover:underline">← Back to deals</Link>

        <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="relative h-64 w-full">
            <Image src={deal.image_url} alt={deal.dest_city} fill className="object-cover" />
            <span className="absolute top-4 left-4 bg-green-500 text-white text-lg font-bold px-3 py-1 rounded-full">
              {discount}% off
            </span>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              {deal.origin_city} ({deal.origin_iata}) → {deal.dest_city} ({deal.dest_iata})
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.airline}</h1>

            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-4xl font-extrabold text-green-600">{formatPrice(deal.deal_price, deal.currency)}</span>
              <span className="text-lg text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">Travel dates</p>
                <p>{formatDateRange(deal.validity_start, deal.validity_end)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Airline</p>
                <p>{deal.airline}</p>
              </div>
            </div>

            {deal.curator_note && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                <p className="font-semibold mb-1">Curator&apos;s note</p>
                <p>{deal.curator_note}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-6 space-y-3">
              {sourceIsGoogle ? (
                // Source is Google Flights — one primary button with dates
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  🔍 Search on Google Flights ({formatDateRange(deal.validity_start, deal.validity_end)}) →
                </a>
              ) : (
                // Source is airline / OTA — direct booking link as primary
                <>
                  <a
                    href={deal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                  >
                    {bookingLabel} →
                  </a>
                  <a
                    href={googleFlightsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors"
                  >
                    🔍 Compare on Google Flights ({formatDateRange(deal.validity_start, deal.validity_end)})
                  </a>
                </>
              )}
            </div>

            {sourceIsGoogle && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 text-center">
                Prices shown on Google Flights may vary. This deal was verified at {formatPrice(deal.deal_price, deal.currency)} — search quickly as fares change.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center mt-3">
              Prices may change. Always verify before booking. Deal valid {formatDateRange(deal.validity_start, deal.validity_end)}.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPrice, calcDiscount, formatDateRange } from '@/lib/utils'
import DealGate from '@/components/DealGate'

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
  HKG: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=800&h=600&fit=crop',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  JFK: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  DOH: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
  PVG: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
  SHA: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&h=600&fit=crop',
}
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop'
function getDealImage(deal: Deal) {
  const url = deal.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[deal.dest_iata] ?? FALLBACK_IMAGE
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return {}
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) return {}
  return {
    title: `${deal.origin_city} → ${deal.dest_city} for ${formatPrice(deal.deal_price, deal.currency)} | Travelbaby`,
    description: deal.curator_note,
    openGraph: { images: [deal.image_url] },
  }
}

// tfsCabin: Google Flights cabin code (economy=1, PE=2, business=3, first=4)
function detectCabin(note: string | null): { label: string; skyscanner: string; tfsCabin: number } | null {
  const n = (note ?? '').toLowerCase()
  if (n.includes('first class')) return { label: 'First Class', skyscanner: 'first', tfsCabin: 4 }
  if (n.includes('business')) return { label: 'Business', skyscanner: 'business', tfsCabin: 3 }
  if (n.includes('premium economy') || n.includes('premium_economy')) return { label: 'Premium Economy', skyscanner: 'premiumeconomy', tfsCabin: 2 }
  return null
}

// --- Minimal protobuf varint/base64url helpers for Google Flights deep links ---
function varint(n: number): number[] { const o: number[] = []; while (n > 0x7f) { o.push((n & 0x7f) | 0x80); n >>>= 7 } o.push(n & 0x7f); return o }
function vfield(f: number, v: number): number[] { return [...varint(f << 3), ...varint(v)] }
function lfield(f: number, b: number[]): number[] { return [...varint((f << 3) | 2), ...varint(b.length), ...b] }
function bytesOf(s: string): number[] { return Array.from(Buffer.from(s, 'utf8')) }
function b64url(b: number[]): string { return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') }
const ALL_STOPS = [0x82, 0x01, 0x0b, 0x08, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01]

// Builds a Google Flights deep link with cabin class + dates pre-selected, sorted by cheapest.
// Verified working: airport codes, leg f5=0, tfs f9=cabin, and the cheapest-sort tfu below.
function googleFlightsCabinUrl(orig: string, dest: string, dept: string, ret: string, tfsCabin: number): string {
  const airport = (iata: string) => [...vfield(1, 1), ...lfield(2, bytesOf(iata))]
  const leg = (date: string, from: string, to: string) => [...lfield(2, bytesOf(date)), ...vfield(5, 0), ...lfield(13, airport(from)), ...lfield(14, airport(to))]
  const tfs = b64url([
    ...vfield(1, 28), ...vfield(2, 2),
    ...lfield(3, leg(dept, orig, dest)),
    ...lfield(3, leg(ret, dest, orig)),
    ...vfield(8, 1), ...vfield(9, tfsCabin), ...vfield(14, 1),
    ...ALL_STOPS, ...vfield(19, 1),
  ])
  // tfu = {f2:{f4:2, f5:5}} — f5:5 is Google's "Cheapest" sort. Cabin comes from tfs f9.
  const tfu = b64url(lfield(2, [...vfield(4, 2), ...vfield(5, 5)]))  // EgQgAigF
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=${tfu}&curr=INR`
}

function buildSearchUrls(deal: Deal): { skyscanner: string; google: string } {
  const dept = deal.validity_start
  let ret = deal.validity_end
  if (!ret || ret === dept) {
    const d = new Date(dept)
    d.setDate(d.getDate() + 7)
    ret = d.toISOString().split('T')[0]
  }

  const cabin = detectCabin(deal.curator_note)

  // Skyscanner India — pre-filled with dates + cabin class
  const toYYMM = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7)
  const toDay  = (iso: string) => String(parseInt(iso.slice(8, 10)))
  const skyscanner = `https://www.skyscanner.co.in/transport/flights/${deal.origin_iata.toLowerCase()}/${deal.dest_iata.toLowerCase()}/?adults=1&currency=INR&oym=${toYYMM(dept)}&selectedoday=${toDay(dept)}&iym=${toYYMM(ret)}&selectediday=${toDay(ret)}${cabin ? `&cabinclass=${cabin.skyscanner}` : ''}`

  // Google Flights — protobuf deep link with dates + cheapest sort for every deal.
  // Cabin defaults to economy (1) when no premium cabin is detected.
  const google = googleFlightsCabinUrl(deal.origin_iata, deal.dest_iata, dept, ret, cabin?.tfsCabin ?? 1)

  return { skyscanner, google }
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound()
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single<Deal>()

  if (!deal || deal.status !== 'published') notFound()

  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const { skyscanner: skyscannerUrl, google: googleUrl } = buildSearchUrls(deal)
  const cabin = detectCabin(deal.curator_note)

  return (
    <main className="min-h-screen bg-gray-50">
      <DealGate />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-600 text-sm hover:underline">← Back to deals</Link>

        <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="relative h-64 w-full">
            <Image src={getDealImage(deal)} alt={deal.dest_city} fill className="object-cover" />
            <span className="absolute top-4 left-4 bg-green-500 text-white text-lg font-bold px-3 py-1 rounded-full">
              {discount}% off
            </span>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              {deal.origin_iata}–{deal.dest_iata}–{deal.origin_iata} · {deal.origin_city} ↔ {deal.dest_city}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.airline}</h1>

            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-4xl font-extrabold text-green-600">{formatPrice(deal.deal_price, deal.currency)}</span>
              <span className="text-lg text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
            </div>
            <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              ✈ Return (round-trip) fare · both ways included
            </span>

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

            {/* Cabin class reminder for PE / Business */}
            {cabin && (
              <div className="mt-5 flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <span className="text-violet-500 text-lg mt-0.5">✦</span>
                <p className="text-sm text-violet-800 font-medium">
                  This is a <strong>{cabin.label}</strong> deal. Both links open with <strong>{cabin.label}</strong>, your dates, and the cheapest fares already selected.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-5 space-y-3">
              {/* Skyscanner — pre-filled dates + cabin class */}
              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                🔍 Search on Skyscanner ({formatDateRange(deal.validity_start, deal.validity_end)}) →
              </a>

              {/* Google Flights — protobuf deep link (cabin + dates pre-filled) */}
              <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors">
                Search on Google Flights{cabin ? ` (${cabin.label})` : ''}
              </a>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 text-center">
              Prices may vary. This deal was verified at {formatPrice(deal.deal_price, deal.currency)} — search quickly as fares change.
            </p>

            <p className="text-xs text-gray-400 text-center mt-3">
              Prices may change. Always verify before booking. Deal valid {formatDateRange(deal.validity_start, deal.validity_end)}.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

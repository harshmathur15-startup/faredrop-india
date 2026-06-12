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

// Google Knowledge Graph city IDs used by Google Flights tfs deep links.
// Confirmed from live Google Flights URLs — city-level IDs, not airport-level.
const KGID: Record<string, string> = {
  // Indian metros
  DEL: '/m/01d88c', BOM: '/m/0c8tk',  BLR: '/m/06cy0',
  MAA: '/m/0c_m3',  HYD: '/m/0c6yfh', CCU: '/m/0754d',
  // Southeast Asia
  BKK: '/m/05fjf',  SIN: '/m/06wjf',  KUL: '/m/0d9jr',
  DPS: '/m/0h3y',   HKT: '/m/01b8w0', SGN: '/m/01crd5',
  HAN: '/m/0frth',  MNL: '/m/06_kh',
  // Middle East
  DXB: '/m/09bhj',  DOH: '/m/01bf4v', AUH: '/m/0f2w0', MCT: '/m/01hqk',
  // East Asia
  NRT: '/m/07dfk',  KIX: '/m/01yk13', ICN: '/m/0hsqf',
  HKG: '/m/03h64',  TPE: '/m/06cp5',
  // Europe
  LHR: '/m/04jpl',  CDG: '/m/05qtj',  AMS: '/m/0k3p',
  FRA: '/m/02jxk',  FCO: '/m/06mkj',  BCN: '/m/01jnc3',
  IST: '/m/06nrt',
  // Americas
  JFK: '/m/02_286', LAX: '/m/030qb3', YYZ: '/m/0h7h6', SFO: '/m/01cf93',
  // Indian Ocean / South Asia
  MLE: '/m/01m8n',  CMB: '/m/0s2bt',  KTM: '/m/01b1h1',
  // Africa / Australia
  NBO: '/m/01fvhh', JNB: '/m/0173yg', SYD: '/m/06y57', MEL: '/m/0chgzm',
}

function encodeVarint(v: number): Uint8Array {
  const out: number[] = []
  while (true) {
    const b = v & 0x7f; v >>>= 7
    if (v) out.push(b | 0x80)
    else { out.push(b); break }
  }
  return new Uint8Array(out)
}

function encodeFieldVarint(fn: number, v: number) {
  return concat(encodeVarint((fn << 3) | 0), encodeVarint(v))
}

function encodeFieldBytes(fn: number, d: Uint8Array) {
  return concat(encodeVarint((fn << 3) | 2), encodeVarint(d.length), d)
}

function encodeFieldString(fn: number, s: string) {
  return encodeFieldBytes(fn, new TextEncoder().encode(s))
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let i = 0
  for (const a of arrays) { out.set(a, i); i += a.length }
  return out
}

function buildTfs(originKgid: string, destKgid: string, outboundDate: string, returnDate: string): string {
  const encodeAirport = (type: number, kgid: string) =>
    concat(encodeFieldVarint(1, type), encodeFieldString(2, kgid))

  const encodeLeg = (date: string, airports: [number, string][]) => {
    let leg = concat(encodeFieldString(2, date), encodeFieldVarint(5, 1))
    const fields = [13, 14]
    for (let i = 0; i < airports.length; i++) {
      leg = concat(leg, encodeFieldBytes(fields[i], encodeAirport(airports[i][0], airports[i][1])))
    }
    return leg
  }

  const leg1 = encodeLeg(outboundDate, [[3, originKgid], [2, destKgid]])
  const leg2 = encodeLeg(returnDate,   [[2, destKgid],   [3, originKgid]])
  const maxInt = new Uint8Array([0x08, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01])

  const proto = concat(
    encodeFieldVarint(1, 28),
    encodeFieldVarint(2, 2),
    encodeFieldBytes(3, leg1),
    encodeFieldBytes(3, leg2),
    encodeFieldVarint(8, 1),
    encodeFieldVarint(9, 3),
    encodeFieldVarint(14, 1),
    encodeFieldBytes(16, maxInt),
    encodeFieldVarint(19, 1),
  )

  return Buffer.from(proto).toString('base64url')
}

function buildSearchUrls(deal: Deal): { skyscanner: string; google: string } {
  const dept = deal.validity_start
  let ret = deal.validity_end
  if (!ret || ret === dept) {
    const d = new Date(dept)
    d.setDate(d.getDate() + 7)
    ret = d.toISOString().split('T')[0]
  }

  // Skyscanner India — uses oym/selectedoday query params
  const toYYMM = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7)
  const toDay  = (iso: string) => String(parseInt(iso.slice(8, 10)))
  const skyscanner = `https://www.skyscanner.co.in/transport/flights/${deal.origin_iata.toLowerCase()}/${deal.dest_iata.toLowerCase()}/?adults=1&currency=INR&oym=${toYYMM(dept)}&selectedoday=${toDay(dept)}&iym=${toYYMM(ret)}&selectediday=${toDay(ret)}`

  // Google Flights — tfs deep link if KGIDs available, otherwise text search
  const originKgid = KGID[deal.origin_iata]
  const destKgid   = KGID[deal.dest_iata]
  let google: string
  if (originKgid && destKgid) {
    const tfs = buildTfs(originKgid, destKgid, dept, ret)
    google = `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=EgIgAg`
  } else {
    google = `https://www.google.com/travel/flights?q=Flights+from+${deal.origin_city}+to+${deal.dest_city}`
  }

  return { skyscanner, google }
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
  const { skyscanner: skyscannerUrl, google: googleUrl } = buildSearchUrls(deal)
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
              {/* Primary: direct airline/OTA link if available */}
              {!sourceIsGoogle && bookingLabel && (
                <a href={deal.source_url} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                  {bookingLabel} →
                </a>
              )}

              {/* Skyscanner — always shown, fully pre-filled */}
              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                🔍 Search on Skyscanner ({formatDateRange(deal.validity_start, deal.validity_end)}) →
              </a>

              {/* Google Flights — generic search fallback */}
              <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors">
                Search on Google Flights
              </a>
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

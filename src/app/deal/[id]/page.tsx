import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatPrice, calcDiscount, formatDateRange, tripFromNote } from '@/lib/utils'
import { routeToSlug } from '@/lib/routes'
import Link from 'next/link'
import DealGate from '@/components/DealGate'
import GatedDates from '@/components/GatedDates'
import BackToDeals from '@/components/BackToDeals'
import DealCta from '@/components/DealCta'
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
function getDealImage(deal: Deal) {
  const url = deal.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[deal.dest_iata] ?? FALLBACK_IMAGE
}

// ─── Customer-friendly flight details ────────────────────────────────────────
// The stored curator_note is dense machine text (e.g. "Economy · Out: … · Ret: …
// · N-night trip (ISO→ISO). ~X% under typical. [auto-discovered]"). We parse it
// at render time into clean legs — the stored value is never changed, so the
// cabin/stops/trip filters that read it keep working.
const FARE_DISCLAIMER =
  "*Flight prices are dynamic and may change at any time. Please confirm the final fare and review the booking platform's or airline's terms & conditions before you book."

type Leg = { stops: string; dur: string; lay: string }

const CITY_NAMES: Record<string, string> = {
  CPH: 'Copenhagen', KWI: 'Kuwait', HKG: 'Hong Kong', BOM: 'Mumbai', DOH: 'Doha',
  KUL: 'Kuala Lumpur', SIN: 'Singapore', AUH: 'Abu Dhabi', DXB: 'Dubai', CMB: 'Colombo',
  LHR: 'London', PAT: 'Patna', DEL: 'Delhi', BLR: 'Bengaluru', MAA: 'Chennai',
  HYD: 'Hyderabad', CCU: 'Kolkata', IST: 'Istanbul', AMS: 'Amsterdam',
}
const cityName = (s: string) => {
  const t = s.replace(/\(.*?\)/, '').trim()
  return CITY_NAMES[t.toUpperCase()] ?? CITY_NAMES[t] ?? t
}
const prettyDur = (d: string) => (d ? d.replace(/(\d+)h\s?(\d+)m?/, '$1h $2m').replace(/(\d+)h(?!\s?\d)/, '$1h') : '')
const stripInternal = (n: string) => n.replace(/\s*\[auto-discovered\]\s*/gi, ' ').trim()
const pctUnder = (n: string) => {
  const m = n.match(/~?\s*(\d+)\s*%\s*under\s*(?:typical|normal)/i)
  return m ? +m[1] : null
}
function parseLeg(seg: string): Leg {
  seg = seg.replace(/^·|·$/g, '').trim()
  const sm = seg.match(/(Nonstop|\d+\s*stops?(?:\s*via\s*[^·(]+)?)/i)
  let stops = sm ? sm[1].trim() : ''
  stops = stops.replace(/via\s*([A-Za-z ()]+)/i, (_m, p) => 'via ' + cityName(p.trim())).replace(/nonstop/i, 'Non-stop')
  const lay = (seg.match(/layover\s*(\d{1,2}h\s?\d{0,2}m?)/i) ?? [])[1] ?? ''
  const durs = seg.match(/\b\d{1,2}h\s?\d{0,2}m?\b/g) ?? []
  const dur = durs.find(d => d !== lay) ?? durs[0] ?? ''
  return { stops, dur: prettyDur(dur), lay: prettyDur(lay) }
}
function parseFlightNote(note: string) {
  const s = stripInternal(note)
  const hasLegs = /Out:/i.test(s) && /Ret:/i.test(s)
  let out: Leg | null = null, ret: Leg | null = null
  if (hasLegs) {
    const core = s
      .replace(/~?\s*\d+\s*%\s*under\s*(?:typical|normal)\.?/i, '')
      .replace(/·?\s*[A-Z–-]*\s*\d+-night trip\s*\([^)]*\)\.?/i, '')
      .replace(/^(Economy|Premium Economy|Business|First Class)\s*·\s*/i, '')
    const oi = core.indexOf('Out:'), ri = core.indexOf('Ret:')
    out = parseLeg(core.slice(oi + 4, ri > -1 ? ri : undefined))
    if (ri > -1) ret = parseLeg(core.slice(ri + 4))
  }
  // Strip the raw ISO date range so the prose fallback never reveals travel dates
  // (dates are gated separately via <GatedDates>).
  const clean = stripInternal(note)
    .replace(/\(\d{4}-\d{2}-\d{2}\s*→\s*\d{4}-\d{2}-\d{2}\)/g, '')
    .replace(/^(Economy|Premium Economy|Business|First Class)\s*·\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return { pct: pctUnder(s), out, ret, hasLegs, clean }
}
function FlightLeg({ dir, leg }: { dir: string; leg: Leg | null }) {
  if (!leg) return null
  const details = [leg.stops, leg.dur].filter(Boolean).join(' · ')
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-blue-500 text-sm leading-5" aria-hidden>✈</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-4">{dir}</p>
        <p className="text-[13px] text-slate-800 font-medium leading-5">
          {details}
          {leg.lay ? <span className="text-slate-400 font-normal"> · {leg.lay} layover</span> : null}
        </p>
      </div>
    </div>
  )
}
function FlightDetails({ note }: { note: string | null }) {
  if (!note) return <p className="mt-4 text-[11px] leading-4 text-slate-400">{FARE_DISCLAIMER}</p>
  const p = parseFlightNote(note)
  return (
    <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Flight details</p>
      {p.hasLegs ? (
        <>
          <FlightLeg dir="Outbound" leg={p.out} />
          <FlightLeg dir="Return" leg={p.ret} />
          {p.pct != null && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              🏷 {p.pct}% under the typical fare
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-slate-600 leading-5">{p.clean}</p>
      )}
      <p className="mt-3 text-[11px] leading-4 text-slate-400">{FARE_DISCLAIMER}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return {}
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) return {}
  const price = formatPrice(deal.deal_price, deal.currency)
  const title = `${deal.origin_city} → ${deal.dest_city} for ${price}`
  const image = getDealImage(deal as Deal)
  return {
    title,
    description: deal.curator_note,
    alternates: { canonical: `/deal/${id}` },
    openGraph: { title, description: deal.curator_note, images: [image], type: 'website' },
    twitter: { card: 'summary_large_image', title, description: deal.curator_note, images: [image] },
  }
}

// tfsCabin: Google Flights cabin code (economy=1, PE=2, business=3, first=4)
function detectCabin(note: string | null): { label: string; tfsCabin: number } | null {
  const n = (note ?? '').toLowerCase()
  if (n.includes('first class')) return { label: 'First Class', tfsCabin: 4 }
  if (n.includes('business')) return { label: 'Business', tfsCabin: 3 }
  if (n.includes('premium economy') || n.includes('premium_economy')) return { label: 'Premium Economy', tfsCabin: 2 }
  return null
}

// --- Minimal protobuf varint/base64url helpers for Google Flights deep links ---
function varint(n: number): number[] { const o: number[] = []; while (n > 0x7f) { o.push((n & 0x7f) | 0x80); n >>>= 7 } o.push(n & 0x7f); return o }
function vfield(f: number, v: number): number[] { return [...varint(f << 3), ...varint(v)] }
function lfield(f: number, b: number[]): number[] { return [...varint((f << 3) | 2), ...varint(b.length), ...b] }
function bytesOf(s: string): number[] { return Array.from(Buffer.from(s, 'utf8')) }
function b64url(b: number[]): string { return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') }

// Builds a Google Flights deep link with cabin class + dates pre-selected, sorted by cheapest.
// IMPORTANT: do NOT set leg field 5 (max-stops) — Google reads leg f5=0 as "Nonstop only",
// which returns no results on routes without a nonstop (e.g. DEL-GVA). Omitting it = "any stops".
function googleFlightsCabinUrl(orig: string, dest: string, dept: string, ret: string, tfsCabin: number): string {
  const airport = (iata: string) => [...vfield(1, 1), ...lfield(2, bytesOf(iata))]
  const leg = (date: string, from: string, to: string) => [...lfield(2, bytesOf(date)), ...lfield(13, airport(from)), ...lfield(14, airport(to))]
  const tfs = b64url([
    ...vfield(1, 28), ...vfield(2, 2),
    ...lfield(3, leg(dept, orig, dest)),
    ...lfield(3, leg(ret, dest, orig)),
    ...vfield(8, 1), ...vfield(9, tfsCabin), ...vfield(14, 1),
    ...vfield(19, 1),
  ])
  // tfu = {f2:{f4:2, f5:5}} — f5:5 is Google's "Cheapest" sort. Cabin comes from tfs f9.
  const tfu = b64url(lfield(2, [...vfield(4, 2), ...vfield(5, 5)]))  // EgQgAigF
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=${tfu}&curr=INR`
}

// One-way variant — single leg, trip type f19:2 (one way; round trip is f19:1).
// Verified byte-for-byte against a Google-generated one-way URL.
function googleFlightsOneWayUrl(orig: string, dest: string, dept: string, tfsCabin: number): string {
  const airport = (iata: string) => [...vfield(1, 1), ...lfield(2, bytesOf(iata))]
  const leg = (date: string, from: string, to: string) => [...lfield(2, bytesOf(date)), ...lfield(13, airport(from)), ...lfield(14, airport(to))]
  // f16 all-stops sentinel {f1:-1} — matches Google's own one-way output.
  const allStops = [0x08, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01]
  const tfs = b64url([
    ...vfield(1, 28), ...vfield(2, 2),
    ...lfield(3, leg(dept, orig, dest)),
    ...vfield(8, 1), ...vfield(9, tfsCabin), ...vfield(14, 1),
    ...lfield(16, allStops),
    ...vfield(19, 2),
  ])
  const tfu = b64url(lfield(2, [...vfield(4, 2), ...vfield(5, 5)]))
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=${tfu}&curr=INR`
}

function buildSearchUrls(deal: Deal): { google: string } {
  const dept = deal.validity_start
  const cabin = detectCabin(deal.curator_note)
  const tfsCabin = cabin?.tfsCabin ?? 1

  // One-way deals → single-leg one-way search.
  if (tripFromNote(deal.curator_note) === 'oneway') {
    return { google: googleFlightsOneWayUrl(deal.origin_iata, deal.dest_iata, dept, tfsCabin) }
  }

  let ret = deal.validity_end
  if (!ret || ret === dept) {
    const d = new Date(dept)
    d.setDate(d.getDate() + 7)
    ret = d.toISOString().split('T')[0]
  }

  // Google Flights — protobuf deep link with dates + cheapest sort for every deal.
  // Cabin defaults to economy (1) when no premium cabin is detected.
  const google = googleFlightsCabinUrl(deal.origin_iata, deal.dest_iata, dept, ret, tfsCabin)

  return { google }
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound()
  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single<Deal>()

  if (!deal || deal.status !== 'published') notFound()

  const discount = calcDiscount(deal.normal_price, deal.deal_price)
  const { google: googleUrl } = buildSearchUrls(deal)
  const cabin = detectCabin(deal.curator_note)
  const oneWay = tripFromNote(deal.curator_note) === 'oneway'

  // Structured data (schema.org Offer) so this deal is eligible for rich results.
  const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${deal.origin_city} → ${deal.dest_city} flight deal`,
    image: getDealImage(deal),
    description: deal.curator_note || `Flight deal from ${deal.origin_city} to ${deal.dest_city}`,
    brand: { '@type': 'Brand', name: deal.airline },
    offers: {
      '@type': 'Offer',
      price: deal.deal_price,
      priceCurrency: deal.currency || 'INR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/deal/${deal.id}`,
      priceValidUntil: deal.validity_start,
    },
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <DealGate dealId={deal.id} />

      {/* Sticky header — turns deep-linked deal pages into browsable entry points */}
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

      <div className="max-w-2xl mx-auto px-4 py-10 pb-28 sm:pb-10">
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
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.airline}</h1>

            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-4xl font-extrabold text-green-600">{formatPrice(deal.deal_price, deal.currency)}</span>
              <span className="text-lg text-gray-400 line-through">{formatPrice(deal.normal_price, deal.currency)}</span>
            </div>
            <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              {oneWay ? '✈ One way fare · single journey' : '✈ Round trip fare · both ways included'}
            </span>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">Travel dates</p>
                <p><GatedDates dealId={deal.id} dates={formatDateRange(deal.validity_start, deal.validity_end)} /></p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Airline</p>
                <p>{deal.airline}</p>
              </div>
            </div>

            <FlightDetails note={deal.curator_note} />

            {/* Route hub link — internal SEO linking + lets users browse the route */}
            <Link
              href={`/flights/${routeToSlug(deal.origin_city, deal.dest_city)}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              See all {deal.origin_city} → {deal.dest_city} deals <span aria-hidden="true">→</span>
            </Link>

            {/* Cabin class reminder for PE / Business */}
            {cabin && (
              <div className="mt-5 flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <span className="text-violet-500 text-lg mt-0.5">✦</span>
                <p className="text-sm text-violet-800 font-medium">
                  This is a <strong>{cabin.label}</strong> deal. The link opens Google Flights with <strong>{cabin.label}</strong>, your dates, and the cheapest fares already selected.
                </p>
              </div>
            )}

            {/* CTA — booking link gated for guests / free users on premium deals */}
            <div className="mt-5 space-y-3">
              <DealCta
                googleUrl={googleUrl}
                dealId={deal.id}
                label={`🔍 Search on Google Flights${cabin ? ` (${cabin.label})` : ''} (${formatDateRange(deal.validity_start, deal.validity_end)}) →`}
              />
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3 text-center">
              Prices may vary. This deal was verified at {formatPrice(deal.deal_price, deal.currency)} — search quickly as fares change.
            </p>

            <p className="text-xs text-gray-400 text-center mt-3">
              Prices may change. Always verify before booking.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky mobile booking bar — keeps the CTA reachable past the hero image */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
        <DealCta googleUrl={googleUrl} dealId={deal.id} label="🔍 Book on Google Flights →" />
      </div>
    </main>
  )
}

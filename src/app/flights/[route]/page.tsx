import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatPrice, calcDiscount } from '@/lib/utils'
import {
  getAllRoutes,
  getRouteData,
  getRelatedRoutes,
  dealImage,
  flagFor,
  type RouteData,
} from '@/lib/routes'
import RouteDealCard from '@/components/RouteDealCard'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelbaby.in'

// SSG + ISR: build all known routes, rebuild hourly so new deals/prices surface.
export const revalidate = 3600

export async function generateStaticParams() {
  const routes = await getAllRoutes()
  return routes.map((r) => ({ route: r.slug }))
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route: string }>
}): Promise<Metadata> {
  const { route } = await params
  const data = await getRouteData(route)
  if (!data) return {}
  const price = formatPrice(data.cheapest, data.currency)
  const off = data.typicalFare > 0 ? calcDiscount(data.typicalFare, data.cheapest) : 0
  const title = `${data.originCity} to ${data.destCity} Flights — Deals from ${price}`
  const description = `Find cheap ${data.originCity} to ${data.destCity} (${data.deals[0]?.origin_iata}–${data.destIata}) flight deals. We track fares from ${price}${
    off > 0 ? `, up to ${off}% below the typical fare` : ''
  }. ${data.nonstopAvailable ? 'Non-stop options. ' : ''}Sign up free for exact dates & booking.`
  const image = dealImage({ image_url: data.deals[0]?.image_url, dest_iata: data.destIata })
  return {
    title,
    description,
    alternates: { canonical: `/flights/${route}` },
    openGraph: { title, description, url: `/flights/${route}`, images: [image], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

function faqsFor(data: RouteData) {
  const o = data.originCity
  const d = data.destCity
  const off = data.typicalFare > 0 ? calcDiscount(data.typicalFare, data.cheapest) : 0
  const cur = data.currency
  const faqs: { q: string; a: string }[] = []

  // Every question below is answered ONLY from data in the deals table — price,
  // tracked history, parsed routing/airline. No unverifiable claims (e.g. visa).

  // Cost — the core "how much is a X to Y flight" query.
  faqs.push({
    q: `How much does a ${o} to ${d} flight cost?`,
    a: `The best ${o}–${d} round-trip fare on Travelbaby right now is ${formatPrice(data.cheapest, cur)}${
      off > 0 ? `, around ${off}% below the typical fare of ${formatPrice(data.typicalFare, cur)}` : ''
    }. The lowest we've tracked on this route is ${formatPrice(data.lowestTracked, cur)}.`,
  })

  // Cheapest month — only when we have ≥2 months of tracked history.
  if (data.cheapestMonth) {
    faqs.push({
      q: `When is the cheapest time to fly ${o} to ${d}?`,
      a: `Across the fares we've tracked, ${data.cheapestMonth.name} has had the lowest ${o}–${d} prices — from ${formatPrice(data.cheapestMonth.price, cur)}. Fares move constantly, so set a free alert to catch the next drop.`,
    })
  }

  // Flight time / routing — only when parsed from the deal.
  if (data.durationText) {
    faqs.push({
      q: `How long is the flight from ${o} to ${d}?`,
      a: data.nonstopAvailable
        ? `The quickest ${o}–${d} deal we feature flies non-stop in about ${data.durationText}.`
        : `The cheapest ${o}–${d} deal we feature is a 1-stop itinerary${data.viaCity ? ` via ${data.viaCity}` : ''}, with a total journey time of around ${data.durationText}.`,
    })
  }

  // Direct flights — common "direct/non-stop flights X to Y" query.
  faqs.push({
    q: `Are there direct (non-stop) flights from ${o} to ${d}?`,
    a: data.nonstopAvailable
      ? `Yes — we've featured non-stop ${o} to ${d} flights. Non-stop availability varies by travel date and airline.`
      : `The ${o}–${d} deals we currently track are 1-stop${data.viaCity ? ` (commonly via ${data.viaCity})` : ''}; non-stop options can be limited on this route.`,
  })

  // Airlines — from the deals on this route.
  if (data.airlines.length) {
    faqs.push({
      q: `Which airlines fly from ${o} to ${d}?`,
      a: `Recent ${o}–${d} deals on Travelbaby have featured ${listJoin(data.airlines)}.`,
    })
  }

  // How to book — the conversion question.
  faqs.push({
    q: `How do I get the travel dates and book a ${o} to ${d} deal?`,
    a: `Sign up free on Travelbaby to unlock the exact travel dates and booking link for every ${o}–${d} deal, and get alerted the moment the fare drops.`,
  })

  return faqs
}

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params
  const data = await getRouteData(route)
  if (!data) notFound()

  const { originCity: o, destCity: d } = data
  const off = data.typicalFare > 0 ? calcDiscount(data.typicalFare, data.cheapest) : 0
  const faqs = faqsFor(data)
  const { sameOrigin, sameDest } = await getRelatedRoutes(data)
  const heroImg = dealImage({ image_url: data.deals[0]?.image_url, dest_iata: data.destIata })
  const signupHref = `/signup?next=${encodeURIComponent(`/flights/${route}`)}`

  // ---- structured data ----
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `${o} to ${d} Flights`, item: `${SITE_URL}/flights/${route}` },
    ],
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${o} to ${d} flight deals`,
    itemListElement: data.deals.slice(0, 20).map((deal, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: `${o} to ${d} flight`,
        price: deal.deal_price,
        priceCurrency: deal.currency,
        url: `${SITE_URL}/deal/${deal.id}`,
      },
    })),
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Nav ── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-12 w-auto drop-shadow" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href={signupHref} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          Sign up free
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative">
        <div className="absolute inset-0">
          <Image src={heroImg} alt={`${d} flights`} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/75 to-blue-900/40" />
        </div>
        <div className="relative max-w-5xl mx-auto px-5 py-14 sm:py-20">
          {/* Breadcrumb */}
          <nav className="text-blue-200 text-xs mb-4 flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span className="text-white font-medium">{o} to {d} Flights</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            {flagFor(data.destIata)} {o} to {d} Flights
          </h1>
          <p className="text-blue-100 mt-3 text-base sm:text-lg max-w-2xl">
            Curated {o}–{d} flight deals, hand-checked for Indian travellers.{' '}
            {data.liveCount} live deal{data.liveCount !== 1 ? 's' : ''} from{' '}
            <span className="font-bold text-white">{formatPrice(data.cheapest, data.currency)}</span>
            {off > 0 && <> — up to <span className="font-bold text-amber-300">{off}% below typical</span></>}.
          </p>

          {/* Price insight */}
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3">
              <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wide">Best live deal</p>
              <p className="text-white font-black text-xl">{formatPrice(data.cheapest, data.currency)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3">
              <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wide">Lowest we've tracked</p>
              <p className="text-white font-black text-xl">{formatPrice(data.lowestTracked, data.currency)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wide">Typical fare</p>
              <p className="text-white font-black text-xl">{formatPrice(data.typicalFare, data.currency)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live deals (teaser, gated) ── */}
      <section className="max-w-6xl mx-auto w-full px-5 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Live {o} → {d} deals</h2>
            <p className="text-gray-500 mt-1 text-sm">{data.liveCount} handpicked fare{data.liveCount !== 1 ? 's' : ''} · sign up free to see dates &amp; book</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.deals.map((deal, i) => (
            <RouteDealCard key={deal.id} deal={deal} position={i} />
          ))}
        </div>

        {/* Signup CTA */}
        <div className="mt-10 text-center py-8 px-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl">
          <p className="text-white font-display text-xl font-bold mb-1">Unlock dates &amp; booking links — free</p>
          <p className="text-blue-100 text-sm mb-5 max-w-md mx-auto">
            Sign up to see exact travel dates for every {o}–{d} deal and get alerted the moment fares drop.
          </p>
          <Link href={signupHref} className="inline-block bg-white text-blue-700 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Sign up free →
          </Link>
          <p className="text-blue-200 text-xs mt-3">No credit card · Takes 30 seconds</p>
        </div>
      </section>

      {/* ── Route facts ── */}
      <section className="max-w-6xl mx-auto w-full px-5 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Airlines seen</p>
            <p className="text-slate-800 font-medium text-sm">{data.airlines.length ? listJoin(data.airlines) : 'Multiple carriers'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Non-stop</p>
            <p className="text-slate-800 font-medium text-sm">{data.nonstopAvailable ? 'Available on this route' : 'Usually 1 stop'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Trip types</p>
            <p className="text-slate-800 font-medium text-sm">{data.oneWayAvailable ? 'Round-trip & one-way' : 'Round trip'}</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto w-full px-5 py-10">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-5">{o} to {d} flights — FAQ</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="bg-white rounded-xl border border-gray-100 p-4 group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between">
                {f.q}
                <span className="text-blue-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Related routes ── */}
      {(sameOrigin.length > 0 || sameDest.length > 0) && (
        <section className="max-w-6xl mx-auto w-full px-5 py-10">
          {sameOrigin.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">More flights from {o}</h2>
              <div className="flex flex-wrap gap-2.5">
                {sameOrigin.map((r) => (
                  <Link key={r.slug} href={`/flights/${r.slug}`} className="bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 text-slate-700 text-sm font-medium px-4 py-2 rounded-full transition-colors">
                    {flagFor(r.destIata)} {r.originCity} → {r.destCity} · from {formatPrice(r.cheapest, r.currency)}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sameDest.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">More flights to {d}</h2>
              <div className="flex flex-wrap gap-2.5">
                {sameDest.map((r) => (
                  <Link key={r.slug} href={`/flights/${r.slug}`} className="bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 text-slate-700 text-sm font-medium px-4 py-2 rounded-full transition-colors">
                    {flagFor(r.destIata)} {r.originCity} → {r.destCity} · from {formatPrice(r.cheapest, r.currency)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 px-5 py-10 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/" className="font-display font-bold text-white">Travelbaby</Link>
            <p className="text-xs text-blue-500">© {new Date().getFullYear()} Travelbaby India · Curated for Indian travellers</p>
          </div>
        </div>
      </footer>

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </main>
  )
}

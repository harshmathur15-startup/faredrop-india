import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Deal } from '@/types'

// Service-role client for the price-history aggregate (reads expired deals,
// which anon RLS blocks). Server-only — the key is a non-public env var, so this
// never ships to the client. Lazily created so module import never throws.
let _admin: ReturnType<typeof createClient> | null = null
function supabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _admin
}

// ---------------------------------------------------------------------------
// Programmatic route landing pages (/flights/[route]).
// A "route" is a city-pair (e.g. Delhi → Bangkok). Multiple airports for the
// same city (Tokyo NRT + HND) collapse into ONE route page, keyed by the
// SEO-friendly city slug. Everything a page shows is derived from the `deals`
// table — published deals via the public anon client, and price history
// (incl. expired) via the service-role client server-side only.
// ---------------------------------------------------------------------------

// SEO-friendly display labels. Default = the stored city string; override only
// where the searched term differs (people search "delhi", not "new delhi").
const CITY_LABEL: Record<string, string> = {
  'New Delhi': 'Delhi',
}
export function labelFor(city: string): string {
  return CITY_LABEL[city] ?? city
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function routeToSlug(originCity: string, destCity: string): string {
  return `${slugify(labelFor(originCity))}-to-${slugify(labelFor(destCity))}`
}

// Destination imagery / flags — small reused maps (mirrors deal page + HeroDeals).
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
  LON: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  PAR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  JFK: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  NYC: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  DOH: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
  CMB: 'https://images.unsplash.com/photo-1588258219511-64eb629cb833?w=800&h=600&fit=crop',
}
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop'

export function dealImage(deal: Pick<Deal, 'image_url' | 'dest_iata'>): string {
  const url = deal.image_url
  if (url && url.startsWith('http') && !url.includes('placehold.co') && !url.includes('placeholder')) return url
  return CITY_IMAGES[deal.dest_iata] ?? FALLBACK_IMAGE
}

const FLAG: Record<string, string> = {
  BKK: '🇹🇭', DMK: '🇹🇭', HKT: '🇹🇭', DPS: '🇮🇩', CGK: '🇮🇩', SIN: '🇸🇬',
  DXB: '🇦🇪', AUH: '🇦🇪', DOH: '🇶🇦', LHR: '🇬🇧', LON: '🇬🇧', CDG: '🇫🇷', PAR: '🇫🇷',
  AMS: '🇳🇱', IST: '🇹🇷', NRT: '🇯🇵', HND: '🇯🇵', ICN: '🇰🇷', HKG: '🇭🇰',
  PVG: '🇨🇳', SHA: '🇨🇳', HAN: '🇻🇳', SGN: '🇻🇳', KUL: '🇲🇾', CMB: '🇱🇰',
  MLE: '🇲🇻', GAN: '🇲🇻', MEL: '🇦🇺', SYD: '🇦🇺', YYZ: '🇨🇦', JFK: '🇺🇸', NYC: '🇺🇸',
  GOI: '🇮🇳', GOX: '🇮🇳', IXL: '🇮🇳', COK: '🇮🇳', UDR: '🇮🇳', SXR: '🇮🇳', CCU: '🇮🇳',
  KTM: '🇳🇵', IXB: '🇮🇳', IXZ: '🇮🇳', DED: '🇮🇳', JAI: '🇮🇳', VNS: '🇮🇳', BLR: '🇮🇳',
  MAA: '🇮🇳', HYD: '🇮🇳', PNQ: '🇮🇳', BOM: '🇮🇳', DEL: '🇮🇳',
  TAS: '🇺🇿', ALA: '🇰🇿', EVN: '🇦🇲', TPE: '🇹🇼', DAC: '🇧🇩', AKL: '🇳🇿', MAD: '🇪🇸',
  KWI: '🇰🇼', RUH: '🇸🇦', BAH: '🇧🇭', MCT: '🇴🇲',
}
export function flagFor(iata: string): string {
  return FLAG[iata] ?? '✈️'
}

// Columns needed to render teaser cards (same shape the homepage fetches).
const DEAL_COLS =
  'id, origin_iata, dest_iata, origin_city, dest_city, airline, normal_price, deal_price, currency, validity_start, validity_end, source_url, image_url, status, published_at, curator_note, created_at, is_premium'

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

export type RouteSummary = {
  slug: string
  originCity: string // display label
  destCity: string // display label
  destIata: string // representative, for flag/image
  liveCount: number
  cheapest: number
  currency: string
}

export type RouteData = RouteSummary & {
  deals: Deal[]
  typicalFare: number // median normal_price across all history
  lowestTracked: number // min deal_price across all history (incl. expired)
  airlines: string[]
  nonstopAvailable: boolean
  oneWayAvailable: boolean
  durationText: string | null // flight time of the cheapest deal, e.g. "3h 55m" (from data)
  viaCity: string | null // layover city of the cheapest 1-stop deal (from data)
  cheapestMonth: { name: string; price: number } | null // month-of-year with the lowest tracked fare (≥2 months of data)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Pull flight time + layover city for the representative (cheapest) deal from
// its curator_note. Best-effort and data-only: returns undefined when absent,
// so the FAQ never asserts something the data doesn't contain.
function parseRepNote(note: string | null | undefined): { durationText: string | null; viaCity: string | null } {
  if (!note) return { durationText: null, viaCity: null }
  const outSeg = note.split(/Ret:/i)[0]
  const dm = outSeg.match(/(\d{1,2})h\s?(\d{2})/)
  const durationText = dm ? `${+dm[1]}h ${dm[2]}m` : null
  const vm = outSeg.match(/via\s+([A-Za-z][A-Za-z .'-]*?)(?:\s*·|\s*,|\s+\d|$)/i)
  const viaCity = vm ? vm[1].trim() : null
  return { durationText, viaCity }
}

// All routes that currently have ≥1 published deal — grouped by city-pair slug.
// Cached per-render. Published-only, so it uses the public anon client.
export const getAllRoutes = cache(async (): Promise<RouteSummary[]> => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
    const { data } = await supabase.from('deals').select(DEAL_COLS).eq('status', 'published')
    const deals = (data ?? []) as Deal[]
    const map = new Map<string, RouteSummary>()
    for (const d of deals) {
      const slug = routeToSlug(d.origin_city, d.dest_city)
      const existing = map.get(slug)
      if (!existing) {
        map.set(slug, {
          slug,
          originCity: labelFor(d.origin_city),
          destCity: labelFor(d.dest_city),
          destIata: d.dest_iata,
          liveCount: 1,
          cheapest: d.deal_price,
          currency: d.currency,
        })
      } else {
        existing.liveCount += 1
        if (d.deal_price < existing.cheapest) {
          existing.cheapest = d.deal_price
          existing.destIata = d.dest_iata
        }
      }
    }
    return [...map.values()].sort((a, b) => b.liveCount - a.liveCount)
  } catch {
    return []
  }
})

// Full data for one route page. Published deals via anon; price-history
// aggregate (incl. expired) via service role, server-side — only numbers escape.
export const getRouteData = cache(async (slug: string): Promise<RouteData | null> => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
    const { data } = await supabase.from('deals').select(DEAL_COLS).eq('status', 'published')
    const published = ((data ?? []) as Deal[]).filter((d) => routeToSlug(d.origin_city, d.dest_city) === slug)
    if (published.length === 0) return null

    const deals = [...published].sort(
      (a, b) =>
        (b.normal_price - b.deal_price) / b.normal_price - (a.normal_price - a.deal_price) / a.normal_price,
    )
    const cheapest = Math.min(...published.map((d) => d.deal_price))
    const airlines = [...new Set(published.map((d) => d.airline).filter(Boolean))]
    const notes = published.map((d) => (d.curator_note || '').toLowerCase())
    const nonstopAvailable = notes.some((n) => /non.?stop/.test(n))
    const oneWayAvailable = notes.some((n) => /one.?way/.test(n))

    // Price history across ALL statuses (service role, server-side only).
    let typicalFare = median(published.map((d) => d.normal_price))
    let lowestTracked = cheapest
    let cheapestMonth: { name: string; price: number } | null = null
    try {
      const { data: hist } = await supabaseAdmin()
        .from('deals')
        .select('origin_city, dest_city, deal_price, normal_price, validity_start')
        .or(`status.eq.published,status.eq.expired`)
      const rows = (hist ?? []).filter(
        (r: { origin_city: string; dest_city: string }) =>
          routeToSlug(r.origin_city, r.dest_city) === slug,
      ) as { deal_price: number; normal_price: number; validity_start: string | null }[]
      if (rows.length) {
        typicalFare = median(rows.map((r) => r.normal_price))
        lowestTracked = Math.min(...rows.map((r) => r.deal_price))
        // Cheapest month-of-year — only when we have ≥2 distinct months of data.
        const byMonth = new Map<number, number>()
        for (const r of rows) {
          if (!r.validity_start) continue
          const m = new Date(r.validity_start).getUTCMonth()
          if (Number.isNaN(m)) continue
          const cur = byMonth.get(m)
          if (cur === undefined || r.deal_price < cur) byMonth.set(m, r.deal_price)
        }
        if (byMonth.size >= 2) {
          const [m, price] = [...byMonth.entries()].sort((a, b) => a[1] - b[1])[0]
          cheapestMonth = { name: MONTHS[m], price }
        }
      }
    } catch {
      // keep published-only fallbacks
    }

    const rep = published.find((d) => d.deal_price === cheapest)!
    const { durationText, viaCity } = parseRepNote(rep.curator_note)
    return {
      slug,
      originCity: labelFor(rep.origin_city),
      destCity: labelFor(rep.dest_city),
      destIata: rep.dest_iata,
      liveCount: published.length,
      cheapest,
      currency: rep.currency,
      deals,
      typicalFare,
      lowestTracked,
      airlines,
      nonstopAvailable,
      oneWayAvailable,
      durationText,
      viaCity,
      cheapestMonth,
    }
  } catch {
    return null
  }
})

// Related routes for internal linking: others from the same origin + others to
// the same destination.
export async function getRelatedRoutes(
  current: RouteSummary,
): Promise<{ sameOrigin: RouteSummary[]; sameDest: RouteSummary[] }> {
  const all = await getAllRoutes()
  const sameOrigin = all
    .filter((r) => r.originCity === current.originCity && r.slug !== current.slug)
    .slice(0, 6)
  const sameDest = all
    .filter((r) => r.destCity === current.destCity && r.slug !== current.slug)
    .slice(0, 6)
  return { sameOrigin, sameDest }
}

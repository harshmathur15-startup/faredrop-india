export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function calcDiscount(normal: number, deal: number): number {
  return Math.round(((normal - deal) / normal) * 100)
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  // One-way deals store the same start & end — show a single date, not a range.
  if (start === end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

// Cabin class is stored in the curator note, not a dedicated column.
// Returns a display label for premium cabins, or null for economy (default, no badge).
export function cabinFromNote(note?: string | null): 'Business' | 'Premium Economy' | null {
  if (!note) return null
  if (/business/i.test(note)) return 'Business'
  if (/premium economy/i.test(note)) return 'Premium Economy'
  return null
}

// Trip type is also stored in the curator note (no dedicated column).
// Defaults to round trip unless the note explicitly marks it one way.
export function tripFromNote(note?: string | null): 'oneway' | 'roundtrip' {
  if (note && /one.?way/i.test(note)) return 'oneway'
  return 'roundtrip'
}

// Stops are described in the curator note ("Nonstop" or "N stop via …"), no
// dedicated column. Returns the worst leg's stop count (so 0 = nonstop both
// ways), or null when the note doesn't say.
export function stopsFromNote(note?: string | null): number | null {
  if (!note) return null
  const nums = [...note.matchAll(/(\d+)\s*stop/gi)].map(m => Number(m[1]))
  if (nums.length) return Math.max(...nums)
  if (/nonstop/i.test(note)) return 0
  return null
}

// Indian airport IATA codes. A route counts as "domestic" only when BOTH ends
// are in India — powers the storefront Domestic/International filter.
const INDIA_IATA = new Set([
  'DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'COK', 'GOI', 'GOX', 'UDR', 'SXR', 'IXL', 'AMD', 'PNQ',
  'JAI', 'LKO', 'PAT', 'GAU', 'BBI', 'IXC', 'NAG', 'IXB', 'IXR', 'IXM', 'IXE', 'IXA', 'IXJ', 'IXZ',
  'IXU', 'IXW', 'TRV', 'CJB', 'VTZ', 'VNS', 'ATQ', 'BDQ', 'STV', 'RAJ', 'IDR', 'BHO', 'RPR', 'JLR',
  'HBX', 'TIR', 'TRZ', 'MDU', 'IXG', 'JDH', 'BKB', 'KUU', 'DED', 'GWL', 'KNU', 'BHU', 'IXY', 'PBD',
  'JGA', 'HSS', 'DHM', 'SLV', 'SHL', 'DMU', 'IMF', 'AJL', 'DIB', 'JRH', 'TEZ', 'IXS', 'IXH', 'RRK',
  'IXI', 'MZU', 'RUP', 'TCR', 'CDP', 'RJA', 'WGC', 'CCJ', 'CNN',
])

export function isIndianAirport(iata?: string | null): boolean {
  return !!iata && INDIA_IATA.has(iata)
}

export function isDomestic(originIata?: string | null, destIata?: string | null): boolean {
  return isIndianAirport(originIata) && isIndianAirport(destIata)
}

// Human "price checked N ago" label from a last_verified_at timestamp.
// Returns null when there is NO timestamp — never claim a fare is live/verified
// without evidence. `stale` flags fares that should be re-verified before booking.
export function formatFreshness(lastVerifiedAt?: string | null): { text: string; stale: boolean } | null {
  if (!lastVerifiedAt) return null
  const then = new Date(lastVerifiedAt).getTime()
  if (!Number.isFinite(then)) return null

  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 2) return { text: 'Price checked just now', stale: false }
  if (mins < 60) return { text: `Price checked ${mins} minutes ago`, stale: false }

  const hours = Math.floor(mins / 60)
  if (hours < 24) return { text: `Price checked ${hours} hour${hours === 1 ? '' : 's'} ago`, stale: false }

  const days = Math.floor(hours / 24)
  if (days === 1) return { text: 'Last checked yesterday — verify the final fare before booking', stale: true }
  return { text: `Last checked ${days} days ago — verify the final fare before booking`, stale: true }
}

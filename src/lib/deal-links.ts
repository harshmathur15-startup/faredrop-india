import type { Deal } from '@/types'
import { tripFromNote } from '@/lib/utils'

// Google Flights booking deep-link builder for a deal. Lifted verbatim from the
// deal page so link behaviour is byte-identical — now server-only, since the link
// is member-only and must be built behind the entitlement-checked API, never
// serialised into the public page.

// tfsCabin: Google Flights cabin code (economy=1, PE=2, business=3, first=4)
function detectCabin(note: string | null): { label: string; tfsCabin: number } | null {
  const n = (note ?? '').toLowerCase()
  if (n.includes('first class')) return { label: 'First Class', tfsCabin: 4 }
  if (n.includes('business')) return { label: 'Business', tfsCabin: 3 }
  if (n.includes('premium economy') || n.includes('premium_economy')) return { label: 'Premium Economy', tfsCabin: 2 }
  return null
}

function varint(n: number): number[] { const o: number[] = []; while (n > 0x7f) { o.push((n & 0x7f) | 0x80); n >>>= 7 } o.push(n & 0x7f); return o }
function vfield(f: number, v: number): number[] { return [...varint(f << 3), ...varint(v)] }
function lfield(f: number, b: number[]): number[] { return [...varint((f << 3) | 2), ...varint(b.length), ...b] }
function bytesOf(s: string): number[] { return Array.from(Buffer.from(s, 'utf8')) }
function b64url(b: number[]): string { return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') }

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
  const tfu = b64url(lfield(2, [...vfield(4, 2), ...vfield(5, 5)]))
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=${tfu}&curr=INR`
}

function googleFlightsOneWayUrl(orig: string, dest: string, dept: string, tfsCabin: number): string {
  const airport = (iata: string) => [...vfield(1, 1), ...lfield(2, bytesOf(iata))]
  const leg = (date: string, from: string, to: string) => [...lfield(2, bytesOf(date)), ...lfield(13, airport(from)), ...lfield(14, airport(to))]
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

export function buildDealGoogleUrl(deal: Deal): string {
  const dept = deal.validity_start
  const tfsCabin = detectCabin(deal.curator_note)?.tfsCabin ?? 1

  if (tripFromNote(deal.curator_note) === 'oneway') {
    return googleFlightsOneWayUrl(deal.origin_iata, deal.dest_iata, dept, tfsCabin)
  }

  let ret = deal.validity_end
  if (!ret || ret === dept) {
    const d = new Date(dept)
    d.setDate(d.getDate() + 7)
    ret = d.toISOString().split('T')[0]
  }
  return googleFlightsCabinUrl(deal.origin_iata, deal.dest_iata, dept, ret, tfsCabin)
}

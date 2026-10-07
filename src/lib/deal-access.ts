import type { Deal } from '../types'

// Note-derivation helpers — kept inline (mirroring src/lib/utils.ts) so this
// module stays a dependency-free leaf and its projection logic is unit-testable
// under `node --test` (which can't resolve the `@/` alias or extensionless imports).
function tripFromNote(note?: string | null): 'oneway' | 'roundtrip' {
  if (note && /one.?way/i.test(note)) return 'oneway'
  return 'roundtrip'
}
function cabinFromNote(note?: string | null): 'Business' | 'Premium Economy' | null {
  if (!note) return null
  if (/business/i.test(note)) return 'Business'
  if (/premium economy/i.test(note)) return 'Premium Economy'
  return null
}
function stopsFromNote(note?: string | null): number | null {
  if (!note) return null
  const nums = [...note.matchAll(/(\d+)\s*stop/gi)].map(m => Number(m[1]))
  if (nums.length) return Math.max(...nums)
  if (/nonstop/i.test(note)) return 0
  return null
}

// Deal access model (Phase-1 entitlement gate)
// ─────────────────────────────────────────────
// PUBLIC (safe for guests, search bots, any client payload):
//   route, destination, image, discount, PRICE, trip type, cabin, stops bucket,
//   travel MONTH (never the exact dates).
// MEMBER-ONLY (never in public HTML / RSC flight data / metadata / structured data):
//   exact travel dates, airline, flight legs/layover (curator_note), booking link.
// Paid (silver/gold) see every deal; free users see only deals they've unlocked.

export type Tier = 'free' | 'silver' | 'gold'
export type Cabin = 'Economy' | 'Premium Economy' | 'Business'

export interface PublicDeal {
  id: string
  origin_iata: string
  dest_iata: string
  origin_city: string
  dest_city: string
  image_url: string
  deal_price: number
  normal_price: number
  currency: string
  status: Deal['status']
  published_at: string | null
  is_premium: boolean
  // Derived, coarse, non-identifying fields the public storefront + filters need.
  trip: 'oneway' | 'roundtrip'
  cabin: Cabin
  stops: number | null          // worst-leg stop count (0/1/2+); NOT the via-airport or layover
  travel_month: string | null   // "YYYY-MM" only — never the exact start/end dates
}

// Strip a full deal row down to the fields that are safe to serve publicly.
export function toPublicDeal(d: Deal): PublicDeal {
  return {
    id: d.id,
    origin_iata: d.origin_iata,
    dest_iata: d.dest_iata,
    origin_city: d.origin_city,
    dest_city: d.dest_city,
    image_url: d.image_url,
    deal_price: d.deal_price,
    normal_price: d.normal_price,
    currency: d.currency,
    status: d.status,
    published_at: d.published_at,
    is_premium: d.is_premium,
    trip: tripFromNote(d.curator_note),
    cabin: cabinFromNote(d.curator_note) ?? 'Economy',
    stops: stopsFromNote(d.curator_note),
    travel_month: (d.validity_start || '').slice(0, 7) || null,
  }
}

// The member-only payload, returned ONLY by the entitlement-checked API.
export interface ProtectedDeal {
  airline: string
  validity_start: string
  validity_end: string
  trip: 'oneway' | 'roundtrip'
  cabin: Cabin
  stops: number | null
  note: string          // curator_note — flight legs / layovers for the Flight-details panel
  google_url: string    // the booking deep link
}

// Pure entitlement decision — mirrors DealGate/DealCta exactly.
// Paid → every deal. Free → only deals THEY have unlocked. Guest (tier null) → never.
export function isEntitled(tier: Tier | null, dealUnlocked: boolean): boolean {
  if (tier === 'silver' || tier === 'gold') return true
  if (!tier) return false            // guest / unknown tier → never entitled
  return dealUnlocked                 // free user → only deals THEY unlocked
}

export type EntitlementReason = 'guest' | 'paid' | 'unlocked' | 'locked'

export interface Entitlement {
  authed: boolean
  tier: Tier | null
  entitled: boolean
  reason: EntitlementReason
}
// The DB-backed server check lives in ./deal-entitlement (imports supabase-admin);
// this module stays pure so the projection + decision logic is unit-testable.

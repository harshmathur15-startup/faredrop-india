import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toPublicDeal, isEntitled, type PublicDeal } from '../src/lib/deal-access.ts'
import type { Deal } from '../src/types/index.ts'

// A full published deal row, including the MEMBER-ONLY fields.
const DEAL: Deal = {
  id: '04b98d58-efdf-401a-96b4-aeb9f72e88f3',
  origin_iata: 'DEL', dest_iata: 'AUH',
  origin_city: 'New Delhi', dest_city: 'Abu Dhabi',
  airline: 'Air India',
  normal_price: 50000, deal_price: 33522, currency: 'INR',
  validity_start: '2026-10-25', validity_end: '2026-10-31',
  source_url: 'https://www.google.com/travel/flights/search?tfs=SECRET',
  image_url: 'https://img/auh.jpg',
  status: 'published', published_at: '2026-10-01T00:00:00Z',
  curator_note: 'Economy · Out: Air India · 1 stop via TRV · 14h · layover 3h · Ret: Air India · Nonstop · 4h · 6-night trip (2026-10-25 → 2026-10-31). ~33% under typical. [auto-discovered]',
  created_at: '2026-10-01T00:00:00Z', is_premium: false,
}

const GATED = ['airline', 'validity_start', 'validity_end', 'source_url', 'curator_note', 'normal_price_hidden']

test('toPublicDeal omits every member-only field', () => {
  const pub = toPublicDeal(DEAL)
  for (const k of ['airline', 'validity_start', 'validity_end', 'source_url', 'curator_note']) {
    assert.equal((pub as Record<string, unknown>)[k], undefined, `public deal must not expose "${k}"`)
  }
  // Serialized form (what actually ships to the client) must contain none of the secrets.
  const json = JSON.stringify(pub)
  assert.ok(!json.includes('Air India'), 'airline leaked in serialized public deal')
  assert.ok(!json.includes('2026-10-25'), 'exact date leaked in serialized public deal')
  assert.ok(!json.includes('2026-10-31'), 'exact date leaked in serialized public deal')
  assert.ok(!json.toLowerCase().includes('google.com/travel'), 'booking link leaked')
  assert.ok(!json.includes('layover'), 'flight legs leaked')
  assert.ok(!json.includes('via TRV'), 'connection leaked')
})

test('toPublicDeal keeps the approved public fields', () => {
  const pub = toPublicDeal(DEAL)
  assert.equal(pub.origin_city, 'New Delhi')
  assert.equal(pub.dest_city, 'Abu Dhabi')
  assert.equal(pub.deal_price, 33522)      // price is public
  assert.equal(pub.normal_price, 50000)
  assert.equal(pub.currency, 'INR')
})

test('toPublicDeal derives coarse public fields from the note', () => {
  const pub = toPublicDeal(DEAL)
  assert.equal(pub.trip, 'roundtrip')
  assert.equal(pub.cabin, 'Economy')
  assert.equal(pub.stops, 1)               // worst leg = 1 stop (bucket only, no via/layover)
  assert.equal(pub.travel_month, '2026-10') // month only — never the exact dates
})

test('cabin + trip derive for a one-way business deal', () => {
  const d: Deal = { ...DEAL, validity_end: DEAL.validity_start, curator_note: 'Business · Out: Emirates · Nonstop · 4h · one way' }
  const pub = toPublicDeal(d)
  assert.equal(pub.cabin, 'Business')
  assert.equal(pub.trip, 'oneway')
  assert.equal(pub.stops, 0)
})

test('isEntitled: paid sees every deal', () => {
  assert.equal(isEntitled('silver', false), true)
  assert.equal(isEntitled('gold', false), true)
})

test('isEntitled: free user only sees deals they unlocked', () => {
  assert.equal(isEntitled('free', true), true)
  assert.equal(isEntitled('free', false), false)
})

test('isEntitled: guest (no tier) is never entitled', () => {
  assert.equal(isEntitled(null, false), false)
  assert.equal(isEntitled(null, true), false) // a guest cannot have an unlock
})

// Guard: the PublicDeal type itself must not carry member-only keys (compile-time
// + a runtime shape check on the known key set).
test('PublicDeal shape is exactly the approved key set', () => {
  const pub: PublicDeal = toPublicDeal(DEAL)
  const keys = Object.keys(pub).sort()
  const expected = [
    'cabin', 'currency', 'deal_price', 'dest_city', 'dest_iata', 'id', 'image_url',
    'is_premium', 'normal_price', 'origin_city', 'origin_iata', 'published_at',
    'status', 'stops', 'travel_month', 'trip',
  ].sort()
  assert.deepEqual(keys, expected)
  void GATED
})

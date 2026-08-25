import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseFlightApiResponse,
  buildItineraryKey,
  MAX_ITINERARIES,
} from '../src/lib/parseFlightApi.ts'

// ---- synthetic FlightAPI.io payload builder -------------------------------
type LegSpec = { airline: string; stops: number; depart: string; arrive: string; duration?: number; via?: string }
type ItinSpec = { price: number | null; out: LegSpec; ret?: LegSpec }

function makeRaw(specs: ItinSpec[]) {
  const legs: Record<string, unknown>[] = []
  const itineraries: Record<string, unknown>[] = []
  const segments: Record<string, unknown>[] = []
  const carriers = new Map<string, string>()
  let legN = 0
  let segN = 0

  const mkLeg = (leg: LegSpec) => {
    const id = `leg${legN++}`
    const segId = `seg${segN++}`
    segments.push({ id: segId, duration: leg.duration ?? 0 })
    carriers.set(leg.airline, leg.airline)
    legs.push({
      id,
      stop_count: leg.stops,
      departure: leg.depart,
      arrival: leg.arrive,
      duration: leg.duration ?? 100,
      marketing_carrier_ids: [leg.airline],
      stop_ids: leg.via ? [[leg.via]] : [],
      segment_ids: [segId],
    })
    return id
  }

  for (const s of specs) {
    const legIds = [mkLeg(s.out)]
    if (s.ret) legIds.push(mkLeg(s.ret))
    itineraries.push({
      pricing_options: s.price == null ? [] : [{ price: { amount: s.price } }],
      leg_ids: legIds,
    })
  }

  return {
    itineraries,
    legs,
    segments,
    carriers: [...carriers.keys()].map(name => ({ id: name, name })),
    places: [],
  }
}

const OPTS = { searchOrigin: 'DEL', searchDest: 'BKK', cabinClass: 'economy', currency: 'INR' }
const nonstop = (i: number, price: number): ItinSpec => ({
  price,
  out: { airline: 'IndiGo', stops: 0, depart: `2026-09-0${1 + (i % 9)}T${(6 + (i % 12)).toString().padStart(2, '0')}:00:00`, arrive: '2026-09-01T16:00:00' },
  ret: { airline: 'IndiGo', stops: 0, depart: `2026-09-1${i % 9}T18:00:00`, arrive: '2026-09-19T23:30:00' },
})

// ---- tests ----------------------------------------------------------------

test('stores at most MAX_ITINERARIES (25) per search', () => {
  const specs = Array.from({ length: 40 }, (_, i) => nonstop(i, 20000 + i * 100))
  const rows = parseFlightApiResponse(makeRaw(specs), OPTS)
  assert.equal(MAX_ITINERARIES, 25)
  assert.equal(rows.length, 25)
  // all distinct itineraries => 25 cheapest kept
  const maxKept = Math.max(...rows.map(r => r.price_inr))
  assert.ok(maxKept <= 20000 + 24 * 100, 'kept the 25 cheapest')
})

test('nonstop / one-stop results are prioritised over multi-stop', () => {
  const specs: ItinSpec[] = [
    // one expensive nonstop
    { price: 90000, out: { airline: 'AI', stops: 0, depart: '2026-09-01T09:00:00', arrive: '2026-09-01T15:00:00' }, ret: { airline: 'AI', stops: 0, depart: '2026-09-10T18:00:00', arrive: '2026-09-10T23:00:00' } },
    // many cheap two-stops
    ...Array.from({ length: 30 }, (_, i) => ({
      price: 10000 + i,
      out: { airline: 'XX', stops: 2, depart: `2026-09-02T${(6 + i % 12).toString().padStart(2, '0')}:00:00`, arrive: '2026-09-02T22:00:00', via: 'DOH' },
      ret: { airline: 'XX', stops: 2, depart: `2026-09-1${i % 9}T20:00:00`, arrive: '2026-09-19T10:00:00', via: 'DOH' },
    } as ItinSpec)),
  ]
  const rows = parseFlightApiResponse(makeRaw(specs), OPTS)
  assert.equal(rows[0].out_stops, 0, 'the nonstop ranks first despite being pricier')
  assert.equal(rows.length, 25)
})

test('itinerary_key is stable across price and observation time', () => {
  const spec = nonstop(3, 30000)
  const a = parseFlightApiResponse(makeRaw([spec]), { ...OPTS, observedAt: '2026-08-01T00:00:00Z' })
  const b = parseFlightApiResponse(makeRaw([{ ...spec, price: 45000 }]), { ...OPTS, observedAt: '2026-08-25T12:00:00Z' })
  assert.equal(a.length, 1)
  assert.equal(b.length, 1)
  assert.equal(a[0].itinerary_key, b[0].itinerary_key, 'price/observation change must NOT fork identity')
  assert.notEqual(a[0].price_inr, b[0].price_inr)
})

test('same itinerary at a new price does not create duplicates within a batch', () => {
  const spec = nonstop(4, 45000)
  const dup = { ...spec, price: 30000 }
  const rows = parseFlightApiResponse(makeRaw([spec, dup]), OPTS)
  assert.equal(rows.length, 1, 'deduped by itinerary_key')
  assert.equal(rows[0].price_inr, 30000, 'keeps the cheaper price')
})

test('buildItineraryKey produces the exact canonical string (SQL parity)', () => {
  const key = buildItineraryKey({
    search_origin: 'DEL', search_dest: 'BKK', trip_type: 'roundtrip', cabin_class: 'Economy',
    out_depart: '2026-09-01T10:30:00', out_arrive: '2026-09-01T16:00:00',
    out_airline: 'IndiGo', out_stops: 0, out_via: '',
    ret_depart: '2026-09-10T18:00:00', ret_arrive: '2026-09-10T23:30:00',
    ret_airline: 'IndiGo', ret_stops: 0, ret_via: '',
  })
  assert.equal(
    key,
    'DEL|BKK|roundtrip|economy|2026-09-01T10:30:00|2026-09-01T16:00:00|IndiGo|0||2026-09-10T18:00:00|2026-09-10T23:30:00|IndiGo|0|',
  )
})

test('buildItineraryKey pads a missing-seconds timestamp to 19 chars', () => {
  const withSecs = buildItineraryKey({
    search_origin: 'DEL', search_dest: 'BKK', trip_type: 'oneway', cabin_class: 'economy',
    out_depart: '2026-09-01T10:30:00', out_arrive: null, out_airline: 'AI', out_stops: 1, out_via: 'DOH',
    ret_depart: null, ret_arrive: null, ret_airline: null, ret_stops: null, ret_via: null,
  })
  const noSecs = buildItineraryKey({
    search_origin: 'DEL', search_dest: 'BKK', trip_type: 'oneway', cabin_class: 'economy',
    out_depart: '2026-09-01T10:30', out_arrive: null, out_airline: 'AI', out_stops: 1, out_via: 'DOH',
    ret_depart: null, ret_arrive: null, ret_airline: null, ret_stops: null, ret_via: null,
  })
  assert.equal(withSecs, noSecs)
})

test('rejects missing / implausible / non-numeric prices', () => {
  const specs: ItinSpec[] = [
    { price: 0, out: { airline: 'A', stops: 0, depart: '2026-09-01T06:00:00', arrive: '2026-09-01T12:00:00' } },
    { price: 500, out: { airline: 'A', stops: 0, depart: '2026-09-02T06:00:00', arrive: '2026-09-02T12:00:00' } }, // below MIN_PLAUSIBLE_INR
    { price: null, out: { airline: 'A', stops: 0, depart: '2026-09-03T06:00:00', arrive: '2026-09-03T12:00:00' } },
    { price: 30000, out: { airline: 'A', stops: 0, depart: '2026-09-04T06:00:00', arrive: '2026-09-04T12:00:00' } }, // valid
  ]
  const rows = parseFlightApiResponse(makeRaw(specs), OPTS)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].price_inr, 30000)
})

test('empty or malformed responses yield no rows', () => {
  assert.deepEqual(parseFlightApiResponse(null, OPTS), [])
  assert.deepEqual(parseFlightApiResponse({}, OPTS), [])
  assert.deepEqual(parseFlightApiResponse({ itineraries: [] }, OPTS), [])
})

test('every stored row carries fare timestamps', () => {
  const rows = parseFlightApiResponse(makeRaw([nonstop(1, 25000)]), { ...OPTS, observedAt: '2026-08-25T10:00:00Z' })
  const r = rows[0]
  assert.equal(r.price_retrieved_at, '2026-08-25T10:00:00Z')
  assert.equal(r.deal_calculated_at, '2026-08-25T10:00:00Z')
  assert.equal(r.last_verified_at, '2026-08-25T10:00:00Z')
  assert.ok(r.itinerary_key.length > 0)
})

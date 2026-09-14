// Config for the daily deal-discovery agent (see /api/cron/discover-deals).
// Lanes are split into rotation groups so only a subset is scanned each day,
// keeping FlightAPI spend bounded (~300 credits/day).

export interface Lane {
  origin: string
  dest: string
  originCity: string
  destCity: string
  nights: number          // return = depart + nights
  normalPrice: number     // typical economy RT (INR) — drives discount + selection
}

// Only destinations with a verified image are eligible (guardrail: no image → skip).
export const DEST_IMAGE: Record<string, string> = {
  SIN: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&h=600&fit=crop',
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  KUL: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  HKT: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop',
  DPS: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  HAN: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&h=600&fit=crop',
  CMB: 'https://images.unsplash.com/photo-1742277295420-650b9134086a?w=800&q=85&fit=crop&auto=format',
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
  KTM: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  AUH: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
  LON: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  PAR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  NYC: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
  AMS: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  MAD: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop',
}

export const LANES: Lane[] = [
  { origin: 'DEL', dest: 'SIN', originCity: 'New Delhi', destCity: 'Singapore',   nights: 6, normalPrice: 40000 },
  { origin: 'DEL', dest: 'BKK', originCity: 'New Delhi', destCity: 'Bangkok',     nights: 6, normalPrice: 32000 },
  { origin: 'DEL', dest: 'KUL', originCity: 'New Delhi', destCity: 'Kuala Lumpur',nights: 6, normalPrice: 42000 },
  { origin: 'DEL', dest: 'HKT', originCity: 'New Delhi', destCity: 'Phuket',      nights: 5, normalPrice: 42000 },
  { origin: 'DEL', dest: 'DPS', originCity: 'New Delhi', destCity: 'Bali',        nights: 7, normalPrice: 55000 },
  { origin: 'DEL', dest: 'HAN', originCity: 'New Delhi', destCity: 'Hanoi',       nights: 6, normalPrice: 52000 },
  { origin: 'DEL', dest: 'CMB', originCity: 'New Delhi', destCity: 'Colombo',     nights: 5, normalPrice: 42000 },
  { origin: 'DEL', dest: 'MLE', originCity: 'New Delhi', destCity: 'Male',        nights: 5, normalPrice: 47000 },
  { origin: 'DEL', dest: 'KTM', originCity: 'New Delhi', destCity: 'Kathmandu',   nights: 6, normalPrice: 38000 },
  { origin: 'DEL', dest: 'DXB', originCity: 'New Delhi', destCity: 'Dubai',       nights: 5, normalPrice: 38000 },
  { origin: 'DEL', dest: 'AUH', originCity: 'New Delhi', destCity: 'Abu Dhabi',   nights: 6, normalPrice: 45000 },
  { origin: 'DEL', dest: 'LON', originCity: 'New Delhi', destCity: 'London',      nights: 7, normalPrice: 85000 },
  { origin: 'DEL', dest: 'PAR', originCity: 'New Delhi', destCity: 'Paris',       nights: 7, normalPrice: 82000 },
  { origin: 'DEL', dest: 'NYC', originCity: 'New Delhi', destCity: 'New York',    nights: 7, normalPrice: 130000 },
  { origin: 'BOM', dest: 'SIN', originCity: 'Mumbai',    destCity: 'Singapore',   nights: 6, normalPrice: 42000 },
  { origin: 'BOM', dest: 'BKK', originCity: 'Mumbai',    destCity: 'Bangkok',     nights: 6, normalPrice: 34000 },
  { origin: 'BOM', dest: 'DXB', originCity: 'Mumbai',    destCity: 'Dubai',       nights: 5, normalPrice: 32000 },
  { origin: 'BOM', dest: 'CMB', originCity: 'Mumbai',    destCity: 'Colombo',     nights: 5, normalPrice: 34000 },
  { origin: 'BOM', dest: 'MLE', originCity: 'Mumbai',    destCity: 'Male',        nights: 5, normalPrice: 42000 },
  { origin: 'BOM', dest: 'LON', originCity: 'Mumbai',    destCity: 'London',      nights: 7, normalPrice: 85000 },
  { origin: 'DEL', dest: 'AMS', originCity: 'New Delhi', destCity: 'Amsterdam',   nights: 7, normalPrice: 78000 },
  { origin: 'DEL', dest: 'MAD', originCity: 'New Delhi', destCity: 'Madrid',      nights: 7, normalPrice: 85000 },
]

// ── Guardrails ───────────────────────────────────────────────────────────────
export const ROTATION_GROUPS   = 5      // scan 1/5 of the lanes each day
export const DATES_PER_LANE     = 30    // consecutive departure dates scanned per lane
export const WINDOW_START_OFFSET = 18   // start scanning departures this many days out
export const MIN_DISCOUNT       = 0.20  // only publish if >=20% below normalPrice
export const MAX_LAYOVER_MIN    = 480   // nonstop or <=1 stop with every layover <8h
export const PER_LANE_MAX       = 1     // at most 1 new deal per lane per run
export const CONCURRENCY        = 15

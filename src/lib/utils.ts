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

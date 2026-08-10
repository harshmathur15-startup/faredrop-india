import { Deal } from '@/types'
import { calcDiscount } from '@/lib/utils'

// The featured deals shown in the hero strip: highest-discount free deals,
// one per destination, capped at `limit` (default 5 = a single row).
// Shared by HeroDeals (to render) and DealsSection (to avoid repeating them).
export function pickHeroDeals(deals: Deal[], limit = 5): Deal[] {
  const scored = deals
    .filter(d => !d.is_premium && calcDiscount(d.normal_price, d.deal_price) > 0)
    .sort((a, b) => calcDiscount(b.normal_price, b.deal_price) - calcDiscount(a.normal_price, a.deal_price))
  const seen = new Set<string>()
  const out: Deal[] = []
  for (const d of scored) {
    if (seen.has(d.dest_iata)) continue
    seen.add(d.dest_iata)
    out.push(d)
    if (out.length >= limit) break
  }
  return out
}

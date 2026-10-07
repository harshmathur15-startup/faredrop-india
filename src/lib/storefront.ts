import type { PublicDeal } from '@/lib/deal-access'
import { calcDiscount } from './utils'

// The public/free storefront: which deals anonymous + signed-up-free users see.
// "Spread across destinations": the best deal per destination first (by discount),
// then fill remaining slots with the next-best deals, capped at `limit`.
export function pickStorefront(deals: PublicDeal[], limit = 50): PublicDeal[] {
  const scored = deals
    .map(d => ({ d, disc: calcDiscount(d.normal_price, d.deal_price) }))
    .sort((a, b) => b.disc - a.disc)
  const seen = new Set<string>()
  const primary: PublicDeal[] = []
  const rest: PublicDeal[] = []
  for (const { d } of scored) {
    if (seen.has(d.dest_iata)) rest.push(d)
    else { seen.add(d.dest_iata); primary.push(d) }
  }
  return [...primary, ...rest].slice(0, limit)
}

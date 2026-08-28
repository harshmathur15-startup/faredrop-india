// Razorpay subscription Plan IDs (created via API in the Razorpay account).
// NOTE: these are TEST-mode plan IDs — recreate the plans in live mode and
// swap these IDs (or move them to env vars) before going live.
import type { Tier } from './razorpay'

export type Cycle = 'monthly' | 'annual'

export const RAZORPAY_PLANS: Record<Tier, Record<Cycle, string>> = {
  silver: { monthly: 'plan_TVHIf4gP3R41xE', annual: 'plan_TVHIgFokVIRDwP' },
  gold:   { monthly: 'plan_TVHIgUtbLe1bJS', annual: 'plan_TVHIgkWR2rxxFR' },
}

// How many billing cycles before Razorpay auto-completes the subscription.
// Effectively "keep renewing for ~10 years".
export const TOTAL_COUNT: Record<Cycle, number> = {
  monthly: 120,
  annual: 10,
}

export function planId(tier: Tier, annual: boolean): string {
  return RAZORPAY_PLANS[tier][annual ? 'annual' : 'monthly']
}

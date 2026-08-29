// Razorpay subscription Plan IDs (created via API). Test and live plans are
// separate in Razorpay, so we keep both sets and pick the one matching the
// active key (rzp_live_* vs rzp_test_*). Local dev (test key) → test plans;
// production (live key) → live plans. No code change needed to switch.
import type { Tier } from './razorpay'

export type Cycle = 'monthly' | 'annual'

const TEST_PLANS: Record<Tier, Record<Cycle, string>> = {
  silver: { monthly: 'plan_TVHIf4gP3R41xE', annual: 'plan_TVHIgFokVIRDwP' },
  gold:   { monthly: 'plan_TVHIgUtbLe1bJS', annual: 'plan_TVHIgkWR2rxxFR' },
}

const LIVE_PLANS: Record<Tier, Record<Cycle, string>> = {
  silver: { monthly: 'plan_TVbxtK7k7TgyYS', annual: 'plan_TVbxtflXzQnjgB' },
  gold:   { monthly: 'plan_TVbxttWEn1zWEM', annual: 'plan_TVbxu8qZYgkKzY' },
}

function plans(): Record<Tier, Record<Cycle, string>> {
  return process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? LIVE_PLANS : TEST_PLANS
}

// How many billing cycles before Razorpay auto-completes the subscription.
// Effectively "keep renewing for ~10 years".
export const TOTAL_COUNT: Record<Cycle, number> = {
  monthly: 120,
  annual: 10,
}

export function planId(tier: Tier, annual: boolean): string {
  return plans()[tier][annual ? 'annual' : 'monthly']
}

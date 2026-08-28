// Razorpay server client + tier pricing.
// One-time Standard Checkout orders (not auto-renewing subscriptions yet —
// each payment buys one period; see notes in /api/payments/create-order).
import Razorpay from 'razorpay'

export type Tier = 'silver' | 'gold'

// Amounts in paise (₹1 = 100 paise). Must match the labels in PricingCards.tsx.
//   silver monthly = ₹1 intro   | silver annual = ₹1,199
//   gold   monthly = ₹1,999      | gold   annual = ₹9,999
const PRICING_PAISE: Record<Tier, { monthly: number; annual: number }> = {
  silver: { monthly: 100, annual: 119900 },
  gold:   { monthly: 199900, annual: 999900 },
}

export function amountPaise(tier: Tier, annual: boolean): number {
  return annual ? PRICING_PAISE[tier].annual : PRICING_PAISE[tier].monthly
}

export function isTier(v: unknown): v is Tier {
  return v === 'silver' || v === 'gold'
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

// Lazily construct the client so builds/imports don't fail when keys are absent.
export function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  return new Razorpay({ key_id, key_secret })
}

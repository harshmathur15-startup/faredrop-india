import { supabaseAdmin } from '@/lib/supabase-admin'
import { isEntitled, type Tier, type Entitlement } from '@/lib/deal-access'

// Server-side entitlement check. Uses the service-role client (RLS-bypassing) but
// is always SCOPED to the resolved userId, so it can only ever read that user's
// own tier + unlocks. Returns entitled=false for guests and un-unlocked free users.
export async function getEntitlement(userId: string | null, dealId: string): Promise<Entitlement> {
  if (!userId) return { authed: false, tier: null, entitled: false, reason: 'guest' }

  const { data: pref } = await supabaseAdmin
    .from('user_preferences')
    .select('subscription_tier')
    .eq('user_id', userId)
    .maybeSingle()
  const tier = (pref?.subscription_tier as Tier | undefined) ?? 'free'

  if (tier === 'silver' || tier === 'gold') {
    return { authed: true, tier, entitled: true, reason: 'paid' }
  }

  const { data: unlock } = await supabaseAdmin
    .from('deal_unlocks')
    .select('deal_id')
    .eq('user_id', userId)
    .eq('deal_id', dealId)
    .maybeSingle()
  const unlocked = !!unlock

  return { authed: true, tier, entitled: isEntitled(tier, unlocked), reason: unlocked ? 'unlocked' : 'locked' }
}

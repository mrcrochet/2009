import { createServerSupabase } from '@/lib/supabase/server'

export interface Entitlement {
  readonly active: boolean
  readonly status: string
  readonly priceId: string | null
  readonly currentPeriodEnd: string | null
  /** True when billing is not configured at all — a local dev build, not a paid state. */
  readonly unconfigured: boolean
}

const INACTIVE: Entitlement = {
  active: false,
  status: 'none',
  priceId: null,
  currentPeriodEnd: null,
  unconfigured: false,
}

const ENTITLING = new Set(['active', 'trialing', 'past_due'])

/**
 * The single source of truth for access to days 02+. Always resolved on the server; the client
 * only ever renders the answer.
 */
export async function getServerEntitlement(userId: string | null): Promise<Entitlement> {
  if (!process.env.STRIPE_SECRET_KEY) {
    // Development convenience: with no billing configured there is nothing to sell, and the
    // boundary is still exercised because `active` stays false.
    return { ...INACTIVE, unconfigured: true }
  }
  if (!userId) return INACTIVE

  const supabase = await createServerSupabase()
  if (!supabase) return INACTIVE

  // Filter to entitling statuses before ordering. Postgres sorts NULLS FIRST on a descending
  // order, and a cancelled row with a null period end would otherwise outrank a live one —
  // denying access to someone who is paying.
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, price_id, current_period_end')
    .eq('user_id', userId)
    .in('status', [...ENTITLING])
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<{ status: string; price_id: string | null; current_period_end: string | null }>()

  if (error || !data) return INACTIVE

  return {
    active: ENTITLING.has(data.status),
    status: data.status,
    priceId: data.price_id,
    currentPeriodEnd: data.current_period_end,
    unconfigured: false,
  }
}

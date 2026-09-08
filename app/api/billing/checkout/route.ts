import { NextResponse } from 'next/server'
import { findPlan } from '@/lib/billing/plans'
import { getStripe, siteUrl } from '@/lib/billing/stripe'
import { createServerSupabase, getCurrentUser } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'billing is not configured' }, { status: 503 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  let planId = 'monthly'
  let timelineId: string | null = null
  try {
    const body = (await request.json()) as { plan?: string; timelineId?: string }
    if (body.plan) planId = body.plan
    if (body.timelineId) timelineId = body.timelineId
  } catch {
    /* defaults are fine */
  }

  const plan = findPlan(planId)
  if (!plan?.priceId) {
    return NextResponse.json({ error: 'that plan has no configured price' }, { status: 400 })
  }

  try {
    const customerId = await ensureCustomer(user.id, user.email)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      metadata: { userId: user.id, timelineId: timelineId ?? '' },
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${siteUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}${
        timelineId ? `&claim=${encodeURIComponent(timelineId)}` : ''
      }`,
      cancel_url: `${siteUrl()}/account?checkout=cancelled`,
      allow_promotion_codes: true,
    })
    return NextResponse.json({ url: session.url, priceId: plan.priceId })
  } catch (error) {
    reportError(error, { scope: 'billing.checkout' })
    return NextResponse.json({ error: 'could not start checkout' }, { status: 500 })
  }
}

/**
 * Resolves the Stripe customer for this user, creating one only if there is none.
 *
 * The mapping has to be persisted here, not left to the webhook: without it every abandoned
 * checkout creates another customer, which sprays duplicates across the Stripe dashboard and
 * defeats per-customer promotion and trial limits (`allow_promotion_codes` is on).
 */
async function ensureCustomer(userId: string, email: string | null): Promise<string | null> {
  const supabase = await createServerSupabase()
  const stripe = getStripe()
  if (!supabase || !stripe) return null

  const { data, error: readError } = await supabase
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle<{ stripe_customer_id: string }>()
  if (readError) throw readError

  if (data?.stripe_customer_id) return data.stripe_customer_id

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { userId },
  })

  const { error: writeError } = await supabase
    .from('billing_customers')
    .insert({ user_id: userId, stripe_customer_id: customer.id })
  if (writeError) {
    // A race with the webhook is fine — it wrote the same mapping. Anything else is not, and
    // silently swallowing it is what produced duplicate customers.
    if (writeError.code !== '23505') throw writeError
  }
  return customer.id
}

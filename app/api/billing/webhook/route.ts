import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * Entitlement is written here and read from the database everywhere else.
 *
 * Delivery is at-least-once, so the event id is recorded before the handler runs — but it is
 * only marked `processed_at` once the handler has actually succeeded. A retry of an event that
 * threw is honoured rather than acknowledged, which is the difference between a transient
 * database blip and a paying customer who silently never gets access.
 */
export async function POST(request: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'billing is not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    reportError(error, { scope: 'billing.webhook.verify' })
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'storage is not configured' }, { status: 503 })

  const { error: seenError } = await admin
    .from('billing_events')
    .insert({ id: event.id, type: event.type })

  if (seenError) {
    if (seenError.code !== '23505') {
      reportError(seenError, { scope: 'billing.webhook.idempotency' })
      return NextResponse.json({ error: 'could not record the event' }, { status: 500 })
    }
    // Seen before. Only a *completed* handler makes it a replay to ignore.
    const { data } = await admin
      .from('billing_events')
      .select('processed_at')
      .eq('id', event.id)
      .maybeSingle<{ processed_at: string | null }>()
    if (data?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true })
    }
  }

  try {
    await handle(admin, event)
    const { error: markError } = await admin
      .from('billing_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id)
    if (markError) throw markError
    return NextResponse.json({ received: true })
  } catch (error) {
    reportError(error, { scope: 'billing.webhook.handle', eventType: event.type })
    // Left unprocessed on purpose, so Stripe's retry runs the handler again.
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>

async function handle(admin: Admin, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId ?? session.client_reference_id
      if (userId && typeof session.customer === 'string') {
        const { error } = await admin
          .from('billing_customers')
          .upsert(
            { user_id: userId, stripe_customer_id: session.customer },
            { onConflict: 'user_id' },
          )
        if (error) throw error
      }
      return
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertSubscription(admin, event.data.object)
      return
    default:
      return
  }
}

async function upsertSubscription(admin: Admin, subscription: Stripe.Subscription): Promise<void> {
  // The customer mapping is the authoritative link. Subscription metadata is editable from the
  // Stripe dashboard, so it is a hint and never the answer.
  let userId: string | null = null

  if (typeof subscription.customer === 'string') {
    const { data, error } = await admin
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer)
      .maybeSingle<{ user_id: string }>()
    if (error) throw error
    userId = data?.user_id ?? null
  }

  if (!userId) userId = subscription.metadata?.userId ?? null
  if (!userId) {
    // A subscription created outside our checkout, before the customer row exists. Throwing
    // leaves the event unprocessed so Stripe retries once the mapping has landed.
    throw new Error(`no user for subscription ${subscription.id}`)
  }

  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end ?? null

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: item?.price.id ?? null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  )
  if (error) throw error
}

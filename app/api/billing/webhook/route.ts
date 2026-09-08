import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * Entitlement is written here and read from the database everywhere else. Delivery is
 * at-least-once, so every handler is idempotent and every event id is recorded before use.
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

  // Idempotency: the insert fails on a replayed event id and we acknowledge without re-applying.
  const { error: seenError } = await admin
    .from('billing_events')
    .insert({ id: event.id, type: event.type })
  if (seenError) {
    if (seenError.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    reportError(seenError, { scope: 'billing.webhook.idempotency' })
    return NextResponse.json({ error: 'could not record the event' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId ?? session.client_reference_id
        if (userId && typeof session.customer === 'string') {
          await admin
            .from('billing_customers')
            .upsert(
              { user_id: userId, stripe_customer_id: session.customer },
              { onConflict: 'user_id' },
            )
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertSubscription(admin, stripe, event.data.object)
        break
      }
      default:
        break
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    reportError(error, { scope: 'billing.webhook.handle', eventType: event.type })
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>

async function upsertSubscription(admin: Admin, stripe: Stripe, subscription: Stripe.Subscription) {
  let userId = subscription.metadata?.userId ?? null

  if (!userId && typeof subscription.customer === 'string') {
    const { data } = await admin
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer)
      .maybeSingle<{ user_id: string }>()
    userId = data?.user_id ?? null
  }
  if (!userId) return

  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end ?? null

  await admin.from('subscriptions').upsert(
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
  void stripe
}

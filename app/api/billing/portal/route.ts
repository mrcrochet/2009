import { NextResponse } from 'next/server'
import { getStripe, siteUrl } from '@/lib/billing/stripe'
import { createServerSupabase, getCurrentUser } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

export async function POST() {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'billing is not configured' }, { status: 503 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  const supabase = await createServerSupabase()
  const { data } = (await supabase
    ?.from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle<{ stripe_customer_id: string }>()) ?? { data: null }

  if (!data?.stripe_customer_id) {
    return NextResponse.json({ error: 'no billing account yet' }, { status: 400 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${siteUrl()}/account`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    reportError(error, { scope: 'billing.portal' })
    return NextResponse.json({ error: 'could not open the billing portal' }, { status: 500 })
  }
}

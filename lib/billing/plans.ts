import 'server-only'

/**
 * Prices come from configuration, never from a component string. An unconfigured build still
 * renders the paywall copy; it simply cannot start a checkout.
 */
export interface Plan {
  readonly id: 'monthly' | 'annual'
  readonly name: string
  readonly blurb: string
  readonly priceId: string | null
  readonly displayPrice: string
}

export function getPlans(): readonly Plan[] {
  return [
    {
      id: 'monthly',
      name: 'Full access — monthly',
      blurb:
        'Every case after the first, and the ones that only open once you have filed a report somebody disagreed with.',
      priceId: process.env.STRIPE_PRICE_ID_MONTHLY || null,
      displayPrice: process.env.NEXT_PUBLIC_PRICE_MONTHLY ?? '$6.99/mo',
    },
    {
      id: 'annual',
      name: 'Full access — annual',
      blurb: 'The same, billed once a year.',
      priceId: process.env.STRIPE_PRICE_ID_ANNUAL || null,
      displayPrice: process.env.NEXT_PUBLIC_PRICE_ANNUAL ?? '$59/yr',
    },
  ]
}

export function findPlan(id: string): Plan | null {
  return getPlans().find((p) => p.id === id) ?? null
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY) && getPlans().some((p) => p.priceId)
}

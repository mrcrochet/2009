'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'
import styles from './account.module.css'

interface PlanView {
  id: string
  name: string
  blurb: string
  displayPrice: string
  purchasable: boolean
}

export function BillingActions({
  plans,
  entitled,
  configured,
  timelineId,
}: {
  plans: PlanView[]
  entitled: boolean
  configured: boolean
  timelineId: string | null
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = async (planId: string) => {
    setBusy(planId)
    setError(null)
    try {
      track('checkout_started', { priceId: planId })
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planId, timelineId }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      setError(data.error ?? 'could not start checkout')
    } catch {
      setError('the network refused')
    } finally {
      setBusy(null)
    }
  }

  const portal = async () => {
    setBusy('portal')
    setError(null)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = (await response.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      setError(data.error ?? 'could not open the billing portal')
    } finally {
      setBusy(null)
    }
  }

  if (!configured) {
    return (
      <div className={styles.mono}>
        Billing is not configured in this environment. The paywall boundary is live — Day 02 is
        gated server-side — but no checkout can be started here.
      </div>
    )
  }

  if (entitled) {
    return (
      <div className={styles.row}>
        <button type="button" className="hal-cta" disabled={busy !== null} onClick={portal}>
          MANAGE SUBSCRIPTION
        </button>
        {error ? <span className={styles.mono}>{error}</span> : null}
      </div>
    )
  }

  return (
    <>
      <div className={styles.row}>
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            className={p.id === 'monthly' ? 'hal-cta' : 'hal-cta hal-cta--ghost'}
            disabled={!p.purchasable || busy !== null}
            onClick={() => start(p.id)}
            title={p.blurb}
          >
            {p.displayPrice} — {p.name.replace('Full access — ', '')}
          </button>
        ))}
      </div>
      {error ? <div className={styles.mono}>{error}</div> : null}
    </>
  )
}

'use client'

import { useEffect } from 'react'
import { setAnalyticsProvider } from '@/lib/analytics'

const DISTINCT_KEY = 'two009:distinct-id'
const CONSENT_KEY = 'two009:analytics-consent'

/**
 * Whether analytics may run at all.
 *
 * Setting `NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT=1` makes it opt-in: nothing is sent, and no
 * pseudonymous id is minted, until something calls `grantAnalyticsConsent()`. This is the
 * mechanism, not the policy — where and how consent is asked for is a product decision, and it
 * does not belong inside a fictional 2009 operating system.
 */
function hasConsent(): boolean {
  if (process.env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT !== '1') return true
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'granted'
  } catch {
    return false
  }
}

export function grantAnalyticsConsent(): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
  } catch {
    /* without storage the grant lasts this page only, which is the safe direction */
  }
}

export function revokeAnalyticsConsent(): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, 'denied')
    window.localStorage.removeItem(DISTINCT_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * A dependency-free PostHog-compatible provider. When no key is configured nothing is loaded and
 * nothing is sent, so local development never talks to a third party.
 */
export function AnalyticsBoot() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || !hasConsent()) return
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

    let distinctId = readDistinctId()

    const send = (event: string, properties: Record<string, unknown>) => {
      const body = JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: '2009-web' },
        timestamp: new Date().toISOString(),
      })
      // keepalive so the day-end events survive the navigation that follows them.
      void fetch(`${host}/i/v0/e/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* analytics is never allowed to break the game */
      })
    }

    setAnalyticsProvider({
      capture: send,
      identify: (id) => {
        distinctId = id
        try {
          window.localStorage.setItem(DISTINCT_KEY, id)
        } catch {
          /* ignore */
        }
      },
    })

    return () => setAnalyticsProvider(null)
  }, [])

  return null
}

function readDistinctId(): string {
  try {
    const existing = window.localStorage.getItem(DISTINCT_KEY)
    if (existing) return existing
    const next = crypto.randomUUID()
    window.localStorage.setItem(DISTINCT_KEY, next)
    return next
  } catch {
    return 'anonymous'
  }
}

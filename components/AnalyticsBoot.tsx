'use client'

import { useEffect } from 'react'
import { setAnalyticsProvider } from '@/lib/analytics'

const DISTINCT_KEY = 'two009:distinct-id'

/**
 * A dependency-free PostHog-compatible provider. When no key is configured nothing is loaded and
 * nothing is sent, so local development never talks to a third party.
 */
export function AnalyticsBoot() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
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

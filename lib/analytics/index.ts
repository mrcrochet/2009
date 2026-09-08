import type { AnalyticsEventName, AnalyticsEvents } from './events'

/**
 * Typed analytics adapter. PostHog-compatible; a no-op (dev console only) when unconfigured.
 * Nothing here may accept free text the player wrote.
 */

interface Provider {
  capture(name: string, properties: Record<string, unknown>): void
  identify(id: string): void
}

let provider: Provider | null = null
const queue: { name: string; properties: Record<string, unknown> }[] = []

export function setAnalyticsProvider(next: Provider | null): void {
  provider = next
  if (!provider) return
  while (queue.length > 0) {
    const item = queue.shift()
    if (item) provider.capture(item.name, item.properties)
  }
}

export function track<N extends AnalyticsEventName>(name: N, properties: AnalyticsEvents[N]): void {
  const payload = properties as Record<string, unknown>
  if (provider) {
    provider.capture(name, payload)
    return
  }
  queue.push({ name, properties: payload })
  if (queue.length > 200) queue.shift()
  if (process.env.NODE_ENV === 'development') {
    console.debug('[2009:analytics]', name, payload)
  }
}

export function identify(userId: string): void {
  provider?.identify(userId)
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

export type { AnalyticsEventName, AnalyticsEvents }

import 'server-only'
import { extractFromHtml, normaliseLinks } from './cache'
import { safeFetch } from './security'
import { WayUpRefused, type WayUpDocument, type WayUpResult } from './types'

/**
 * A provider is an interface, not a vendor.
 *
 * The relay's job is to reach today's web; which service does the reaching is an implementation
 * detail that should be replaceable without the game noticing. Snapshots record which provider
 * produced them, so a change of vendor is visible in the data rather than silent.
 */
export interface WayUpProvider {
  readonly name: string
  search(query: string, signal: AbortSignal): Promise<WayUpResult[]>
  fetch(url: string, signal: AbortSignal): Promise<WayUpDocument>
}

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v2'
const MAX_RESULTS = 10
const MAX_TEXT_CHARS = 120_000

function isConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY)
}

/**
 * Firecrawl renders the page and hands back markdown, which is exactly what the relay wants:
 * text and links, never executable markup.
 */
function firecrawlProvider(apiKey: string): WayUpProvider {
  const call = async (path: string, body: unknown, signal: AbortSignal): Promise<unknown> => {
    const response = await globalThis.fetch(`${FIRECRAWL_BASE}${path}`, {
      method: 'POST',
      signal,
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new WayUpRefused(
        'network',
        `the relay could not reach the other side (${response.status})`,
      )
    }
    return response.json()
  }

  return {
    name: 'firecrawl',

    async search(query, signal) {
      const raw = (await call('/search', { query, limit: MAX_RESULTS }, signal)) as {
        data?: { web?: { title?: string; url?: string; description?: string }[] }
      }
      const rows = raw.data?.web ?? []
      return rows
        .filter((row): row is { title?: string; url: string; description?: string } =>
          Boolean(row.url),
        )
        .slice(0, MAX_RESULTS)
        .map((row) => ({
          title: (row.title ?? row.url).slice(0, 300),
          url: row.url,
          snippet: (row.description ?? '').slice(0, 500),
        }))
    },

    async fetch(url, signal) {
      const raw = (await call(
        '/scrape',
        { url, formats: ['markdown', 'links'], onlyMainContent: true },
        signal,
      )) as {
        data?: {
          markdown?: string
          links?: string[]
          metadata?: { title?: string; sourceURL?: string }
        }
      }
      const data = raw.data ?? {}
      return {
        canonicalUrl: data.metadata?.sourceURL ?? url,
        title: (data.metadata?.title ?? url).slice(0, 300),
        text: (data.markdown ?? '').slice(0, MAX_TEXT_CHARS),
        links: normaliseLinks(data.links ?? []),
        remoteFetchedAt: new Date().toISOString(),
      }
    },
  }
}

/**
 * The fallback when no provider is configured: fetch the page ourselves through the SSRF
 * boundary and take the text out of it.
 *
 * It cannot search — there is no index to search — but it means the relay is not a dead app on a
 * developer's machine, and it is the path that proves `safeFetch` is actually load-bearing.
 */
function directProvider(): WayUpProvider {
  return {
    name: 'direct',

    async search() {
      throw new WayUpRefused('network', 'the relay cannot search without an index')
    },

    async fetch(url, signal) {
      const result = await safeFetch(url, { signal })
      const { title, text, links } = extractFromHtml(result.body, result.url)
      return {
        canonicalUrl: result.url,
        title,
        text: text.slice(0, MAX_TEXT_CHARS),
        links,
        remoteFetchedAt: new Date().toISOString(),
      }
    },
  }
}

export function getProvider(): WayUpProvider | null {
  const key = process.env.FIRECRAWL_API_KEY
  if (key) return firecrawlProvider(key)
  // Direct fetch still works and is genuinely useful; only search needs an index.
  return directProvider()
}

export function isRelayConfigured(): boolean {
  return isConfigured()
}

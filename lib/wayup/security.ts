import { lookup } from 'node:dns/promises'
import { WayUpRefused } from './types'

/**
 * The ingestion boundary.
 *
 * Every URL that reaches here came from a player typing into a fictional operating system, which
 * means it is arbitrary and hostile until proven otherwise. This module is the only thing
 * standing between that and the server's own network position — where "the server's network" on
 * a typical deployment includes a cloud metadata endpoint that hands out credentials to anyone
 * who asks politely.
 *
 * Nothing here trusts a header, a hostname, or the first hop of a redirect.
 *
 * Deliberately not marked `server-only`: `node:dns` already makes this unbundlable for a
 * browser, and the guard would put the most security-critical logic in the game beyond the reach
 * of unit tests. The API key lives in `provider.ts`, which does carry the marker.
 */

const MAX_REDIRECTS = 5
const DEFAULT_MAX_BYTES = 1024 * 1024
const DEFAULT_TIMEOUT_MS = 10_000

/** A page, not a download. Anything else is refused before a byte is read. */
const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
]

/**
 * Hostnames that resolve to a metadata service on one cloud or another. The addresses behind
 * them are already blocked by range, but a provider or a proxy may resolve names differently
 * than we do, so the names are refused by their own right as well.
 */
const METADATA_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'metadata',
])

/**
 * Names that mean "this machine" regardless of what DNS says.
 *
 * `assertResolvesPublicly` catches these in practice — `localhost` resolves to 127.0.0.1, which
 * is blocked by range — but only after a lookup. Refusing them by name too means `assertSafeUrl`
 * is sound on its own, so a caller that reaches for it without the resolver (a redirect check, a
 * future provider, a test) is not quietly exposed. It also removes the dependency on `/etc/hosts`
 * and on the resolver agreeing with us.
 */
const LOOPBACK_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
])

// --------------------------------------------------------------------- IPs

/**
 * IPv4 and IPv6 as raw bytes, which is the only representation that makes range checks honest.
 * A textual comparison would have to enumerate `127.0.0.1`, `127.1`, `2130706433`, `0177.0.0.1`
 * and `::ffff:7f00:1` — all of which are the same address.
 */
type Address = { readonly family: 4 | 6; readonly bytes: Uint8Array }

/**
 * Parses every IPv4 literal form a URL can carry: dotted quad, the "a.b.c" and "a.b" shorthands,
 * a bare 32-bit integer, and each part written in decimal, octal (`0177`) or hex (`0x7f`).
 *
 * WHATWG's URL parser normalises most of these already, so in practice `URL.hostname` arrives
 * dotted. It is implemented here anyway: relying on a dependency's normalisation for a security
 * decision means the decision changes when the dependency does.
 */
export function parseIpv4(host: string): Address | null {
  if (host.length === 0 || host.length > 45) return null

  const raw = host.endsWith('.') ? host.slice(0, -1) : host
  const parts = raw.split('.')
  if (parts.length === 0 || parts.length > 4) return null

  const numbers: number[] = []
  for (const part of parts) {
    if (part.length === 0) return null
    let value: number
    if (/^0[xX][0-9a-fA-F]+$/.test(part)) value = Number.parseInt(part.slice(2), 16)
    else if (/^0[0-7]+$/.test(part)) value = Number.parseInt(part.slice(1), 8)
    // A leading zero that is not valid octal, like `09`: WHATWG rejects it outright, and
    // agreeing is the point. Two parsers reading one literal differently is the exact shape of
    // an SSRF bypass, so this refuses rather than inventing a third answer.
    else if (/^0[0-9]+$/.test(part)) return null
    else if (/^[0-9]+$/.test(part)) value = Number.parseInt(part, 10)
    else return null
    if (!Number.isSafeInteger(value) || value < 0) return null
    numbers.push(value)
  }

  // The last part absorbs the remaining octets: `127.1` is 127.0.0.1, `2130706433` is the whole
  // address in one number.
  const last = numbers[numbers.length - 1] as number
  const leading = numbers.slice(0, -1)
  const remaining = 4 - leading.length
  if (last >= 2 ** (8 * remaining)) return null
  if (leading.some((n) => n > 255)) return null

  const bytes = new Uint8Array(4)
  leading.forEach((n, i) => {
    bytes[i] = n
  })
  for (let i = 0; i < remaining; i += 1) {
    bytes[3 - i] = (last >>> (8 * i)) & 0xff
  }
  return { family: 4, bytes }
}

/** Parses an IPv6 literal, with or without brackets, including the `::ffff:1.2.3.4` form. */
export function parseIpv6(host: string): Address | null {
  let text = host
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1)
  const zone = text.indexOf('%')
  if (zone !== -1) text = text.slice(0, zone)
  if (!text.includes(':')) return null

  const doubleColon = text.indexOf('::')
  if (doubleColon !== text.lastIndexOf('::')) return null

  const [headText, tailText] =
    doubleColon === -1 ? [text, ''] : [text.slice(0, doubleColon), text.slice(doubleColon + 2)]

  const toGroups = (segment: string): number[] | null => {
    if (segment.length === 0) return []
    const out: number[] = []
    const pieces = segment.split(':')
    for (let i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i] as string
      // A trailing dotted-quad, as in `::ffff:127.0.0.1`, occupies the final two groups.
      if (piece.includes('.')) {
        if (i !== pieces.length - 1) return null
        const embedded = parseIpv4(piece)
        if (!embedded) return null
        out.push((embedded.bytes[0]! << 8) | embedded.bytes[1]!)
        out.push((embedded.bytes[2]! << 8) | embedded.bytes[3]!)
        continue
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(piece)) return null
      out.push(Number.parseInt(piece, 16))
    }
    return out
  }

  const head = toGroups(headText)
  const tail = toGroups(tailText)
  if (!head || !tail) return null

  const groups: number[] =
    doubleColon === -1
      ? head
      : [...head, ...new Array<number>(Math.max(0, 8 - head.length - tail.length)).fill(0), ...tail]
  if (groups.length !== 8) return null

  const bytes = new Uint8Array(16)
  groups.forEach((group, i) => {
    bytes[i * 2] = (group >>> 8) & 0xff
    bytes[i * 2 + 1] = group & 0xff
  })
  return { family: 6, bytes }
}

export function parseAddress(host: string): Address | null {
  if (host.startsWith('[')) return parseIpv6(host)
  return parseIpv4(host) ?? parseIpv6(host)
}

function inV4Range(
  bytes: Uint8Array,
  a: number,
  b: number,
  c: number,
  d: number,
  prefix: number,
): boolean {
  const target = [a, b, c, d]
  for (let bit = 0; bit < prefix; bit += 1) {
    const byte = bit >>> 3
    const mask = 0x80 >>> (bit & 7)
    if ((bytes[byte]! & mask) !== (target[byte]! & mask)) return false
  }
  return true
}

/**
 * Everything that is not the public internet.
 *
 * The list is deliberately broader than "private": benchmarking, documentation and reserved
 * ranges have no business being reachable from a game, and refusing them costs nothing.
 */
function isBlockedIpv4(bytes: Uint8Array): boolean {
  return (
    inV4Range(bytes, 0, 0, 0, 0, 8) || // this network
    inV4Range(bytes, 10, 0, 0, 0, 8) || // private
    inV4Range(bytes, 100, 64, 0, 0, 10) || // carrier-grade NAT
    inV4Range(bytes, 127, 0, 0, 0, 8) || // loopback
    inV4Range(bytes, 169, 254, 0, 0, 16) || // link-local, and the metadata endpoint with it
    inV4Range(bytes, 172, 16, 0, 0, 12) || // private
    inV4Range(bytes, 192, 0, 0, 0, 24) || // IETF protocol assignments
    inV4Range(bytes, 192, 0, 2, 0, 24) || // TEST-NET-1
    inV4Range(bytes, 192, 88, 99, 0, 24) || // 6to4 relay anycast
    inV4Range(bytes, 192, 168, 0, 0, 16) || // private
    inV4Range(bytes, 198, 18, 0, 0, 15) || // benchmarking
    inV4Range(bytes, 198, 51, 100, 0, 24) || // TEST-NET-2
    inV4Range(bytes, 203, 0, 113, 0, 24) || // TEST-NET-3
    inV4Range(bytes, 224, 0, 0, 0, 4) || // multicast
    inV4Range(bytes, 240, 0, 0, 0, 4) // reserved, and 255.255.255.255 with it
  )
}

function isBlockedIpv6(bytes: Uint8Array): boolean {
  const isZeroPrefix = (length: number) => bytes.slice(0, length).every((b) => b === 0)

  // Unspecified and loopback.
  if (isZeroPrefix(15) && (bytes[15] === 0 || bytes[15] === 1)) return true

  // IPv4-mapped (::ffff:0:0/96) and NAT64 (64:ff9b::/96) both carry a real IPv4 address in the
  // last four bytes. Judging them as IPv6 would let `::ffff:127.0.0.1` through.
  const embedded = bytes.slice(12, 16)
  if (isZeroPrefix(10) && bytes[10] === 0xff && bytes[11] === 0xff) return isBlockedIpv4(embedded)
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x64 &&
    bytes[2] === 0xff &&
    bytes[3] === 0x9b &&
    bytes.slice(4, 12).every((b) => b === 0)
  ) {
    return isBlockedIpv4(embedded)
  }

  if (bytes[0] === 0x01 && isZeroPrefix(1) === false && bytes.slice(1, 8).every((b) => b === 0)) {
    return true // 100::/64 discard-only
  }
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8) return true // documentation
  if ((bytes[0]! & 0xfe) === 0xfc) return true // fc00::/7 unique-local, fd00:ec2::254 among them
  if (bytes[0] === 0xfe && (bytes[1]! & 0xc0) === 0x80) return true // fe80::/10 link-local
  if (bytes[0] === 0xff) return true // multicast

  return false
}

export function isBlockedAddress(address: Address): boolean {
  return address.family === 4 ? isBlockedIpv4(address.bytes) : isBlockedIpv6(address.bytes)
}

// -------------------------------------------------------------------- URLs

function ownHost(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (!site) return null
  try {
    return new URL(site).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Structural checks that need no network: scheme, embedded credentials, our own origin, and any
 * host written as a literal address.
 *
 * Returns the parsed URL so callers cannot accidentally act on the unvalidated string.
 */
export function assertSafeUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new WayUpRefused('unresolvable', 'that is not an address')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new WayUpRefused('scheme', `the relay only speaks http and https, not ${url.protocol}`)
  }

  // `https://user:pass@host` is how a URL smuggles a credential past a naive allowlist, and how
  // a proxy ends up sending one somewhere it was never meant to go.
  if (url.username !== '' || url.password !== '') {
    throw new WayUpRefused('credentials', 'the relay will not carry credentials')
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (host.length === 0) throw new WayUpRefused('unresolvable', 'no host')
  if (LOOPBACK_HOSTS.has(host)) {
    throw new WayUpRefused('private-address', 'that host is this machine')
  }

  if (METADATA_HOSTS.has(host)) {
    throw new WayUpRefused('metadata-endpoint', 'that host is not on the public internet')
  }

  const own = ownHost()
  if (own && host === own) {
    // Otherwise the relay is a confused deputy pointed at our own API routes.
    throw new WayUpRefused('own-origin', 'the relay does not call back into this machine')
  }

  const literal = parseAddress(url.hostname)
  if (literal && isBlockedAddress(literal)) {
    throw new WayUpRefused('private-address', 'that address is not on the public internet')
  }

  return url
}

/**
 * Resolves a hostname and refuses if *any* address behind it is private.
 *
 * This closes the ordinary case — a public name pointed at 127.0.0.1 — but it cannot close DNS
 * rebinding: between this lookup and the socket the runtime opens, the record can change, and
 * nothing at this layer sees that. Fixing it properly means resolving once and connecting to the
 * pinned IP with the Host header preserved (a custom agent), or putting an egress proxy in front
 * that enforces the same ranges. Both are deployment decisions; this is the honest limit of what
 * a fetch wrapper can promise.
 */
export async function assertResolvesPublicly(url: URL): Promise<void> {
  if (parseAddress(url.hostname)) return // already judged as a literal

  let addresses: { address: string; family: number }[]
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new WayUpRefused('unresolvable', 'that host does not resolve')
  }
  if (addresses.length === 0) throw new WayUpRefused('unresolvable', 'that host does not resolve')

  for (const { address } of addresses) {
    const parsed = parseAddress(address)
    if (!parsed || isBlockedAddress(parsed)) {
      throw new WayUpRefused('private-address', 'that host points somewhere private')
    }
  }
}

// ------------------------------------------------------------------ fetch

export interface SafeFetchOptions {
  readonly signal?: AbortSignal
  readonly maxBytes?: number
  readonly timeoutMs?: number
  /** Injected in tests. Defaults to the global. */
  readonly fetchImpl?: typeof fetch
  /** Injected in tests, so DNS is not a dependency of the redirect-chain assertions. */
  readonly resolve?: (url: URL) => Promise<void>
}

export interface SafeFetchResult {
  readonly url: string
  readonly status: number
  readonly contentType: string
  readonly body: string
  readonly byteLength: number
}

/**
 * Fetches a remote page under every constraint above.
 *
 * Redirects are followed manually because each hop is a fresh, unvalidated URL: a permitted host
 * answering `302 Location: http://127.0.0.1/` is the entire attack, and `redirect: 'follow'`
 * would take it without a word.
 */
export async function safeFetch(
  raw: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const doFetch = options.fetchImpl ?? fetch
  const resolve = options.resolve ?? assertResolvesPublicly

  const deadline = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline

  const seen = new Set<string>()
  let current = assertSafeUrl(raw)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (seen.has(current.toString())) {
      throw new WayUpRefused('redirect-loop', 'that address redirects to itself')
    }
    seen.add(current.toString())
    await resolve(current)

    let response: Response
    try {
      response = await doFetch(current, {
        redirect: 'manual',
        signal,
        // No inbound header is forwarded — not cookies, not authorization, not the player's own
        // user agent. The relay speaks only for itself.
        headers: {
          accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
          'user-agent': 'WayUpRelay/0.3 (+read-only archival fetch)',
        },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      })
    } catch (error) {
      if (signal.aborted) throw new WayUpRefused('timeout', 'the other side did not answer')
      throw new WayUpRefused('network', error instanceof Error ? error.message : 'network error')
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new WayUpRefused('network', 'a redirect with nowhere to go')
      if (hop === MAX_REDIRECTS) {
        throw new WayUpRefused('too-many-redirects', 'that address redirects too many times')
      }
      // Re-validated from the top, including the scheme: `Location: file:///etc/passwd` is a
      // real answer some servers give.
      current = assertSafeUrl(new URL(location, current).toString())
      continue
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    const base = contentType.split(';')[0]?.trim() ?? ''
    if (!ALLOWED_CONTENT_TYPES.includes(base)) {
      throw new WayUpRefused('content-type', `the relay reads pages, not ${base || 'that'}`)
    }

    const body = await readBounded(response, maxBytes)
    return {
      url: current.toString(),
      status: response.status,
      contentType: base,
      body,
      byteLength: body.length,
    }
  }

  throw new WayUpRefused('too-many-redirects', 'that address redirects too many times')
}

/**
 * Reads the body while counting, and stops the moment the cap is passed.
 *
 * `content-length` is not consulted: it is a claim by the remote host, and a host willing to
 * exhaust our memory is not one that will declare it honestly.
 */
async function readBounded(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''

  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > maxBytes) {
        throw new WayUpRefused('too-large', 'that page is larger than the relay will carry')
      }
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(joined)
}

export const WAYUP_LIMITS = {
  maxRedirects: MAX_REDIRECTS,
  maxBytes: DEFAULT_MAX_BYTES,
  timeoutMs: DEFAULT_TIMEOUT_MS,
} as const

// ------------------------------------------------------------- rate limit

/**
 * A fixed-window limiter, in process memory.
 *
 * These two routes make outbound requests on a caller's behalf, which makes them the most
 * abusable surface in the application by a wide margin: without a limit, the relay is an open
 * proxy with someone else's egress bill attached.
 *
 * In-memory means per-instance, and a serverless deployment runs many instances — so this raises
 * the cost of abuse rather than capping it. The real answer is a shared counter (Upstash, or the
 * Vercel runtime cache); this is the version that is honest about being a floor, not a ceiling,
 * and it is deliberately strict enough to matter even divided across instances.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 12

const windows = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  readonly ok: boolean
  readonly remaining: number
  readonly retryAfterSeconds: number
}

export function rateLimit(key: string, now = Date.now()): RateLimitResult {
  if (windows.size > 5_000) windows.clear() // crude, but unbounded growth is the worse failure

  const current = windows.get(key)
  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_PER_WINDOW - 1, retryAfterSeconds: 0 }
  }

  if (current.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return { ok: true, remaining: MAX_PER_WINDOW - current.count, retryAfterSeconds: 0 }
}

/**
 * Who is being limited.
 *
 * A signed-in player is identified by their account; a guest by the forwarded address, which is
 * the only stable thing available given Day 01 is deliberately account-free.
 */
export function rateLimitKey(request: Request, userId: string | null): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

export function __resetRateLimits(): void {
  windows.clear()
}

export const RATE_LIMIT = { windowMs: WINDOW_MS, maxPerWindow: MAX_PER_WINDOW } as const

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetRateLimits,
  assertSafeUrl,
  isBlockedAddress,
  parseAddress,
  parseIpv4,
  parseIpv6,
  rateLimit,
  rateLimitKey,
  safeFetch,
} from '@/lib/wayup/security'
import {
  contentHashOf,
  extractFromHtml,
  snapshotFrom,
  snapshotIdFor,
  toBlocks,
} from '@/lib/wayup/cache'
import { WayUpRefused } from '@/lib/wayup/types'

/**
 * The Way Up Machine reaches the real internet on a player's behalf, which makes this the one
 * place in the game where a string typed into a fictional operating system becomes an outbound
 * request from our own network. Every test here is a bypass someone would actually try.
 */

function refusalFor(url: string): string | null {
  try {
    assertSafeUrl(url)
    return null
  } catch (error) {
    return error instanceof WayUpRefused ? error.refusal : 'unknown'
  }
}

describe('address parsing', () => {
  it('reads every IPv4 literal form a URL can carry', () => {
    const forms: [string, number[]][] = [
      ['127.0.0.1', [127, 0, 0, 1]],
      ['2130706433', [127, 0, 0, 1]], // bare 32-bit integer
      ['0177.0.0.1', [127, 0, 0, 1]], // octal first octet
      ['0x7f.0.0.1', [127, 0, 0, 1]], // hex first octet
      ['127.1', [127, 0, 0, 1]], // last part absorbs the rest
      ['192.168.0.1', [192, 168, 0, 1]],
      ['0', [0, 0, 0, 0]],
      ['4294967295', [255, 255, 255, 255]],
    ]
    for (const [text, expected] of forms) {
      const parsed = parseIpv4(text)
      expect(parsed, text).not.toBeNull()
      expect([...parsed!.bytes], text).toEqual(expected)
    }
  })

  it('refuses things that only look like addresses', () => {
    for (const text of ['256.0.0.1', '1.2.3.4.5', '', 'example.com', '0x', '09.0.0.1']) {
      expect(parseIpv4(text), text).toBeNull()
    }
  })

  it('refuses an ambiguous literal instead of guessing, as WHATWG does', () => {
    // `09` is not valid octal and not plainly decimal. `new URL('http://09.0.0.1/')` throws;
    // reading it as 9.0.0.1 here would mean two parsers disagreeing about one address.
    expect(parseIpv4('09.0.0.1')).toBeNull()
    // …while a genuinely octal part is read the same way the URL parser reads it.
    expect([...parseIpv4('010.0.0.1')!.bytes]).toEqual([8, 0, 0, 1])
    expect([...parseIpv4('0177.0.0.1')!.bytes]).toEqual([127, 0, 0, 1])
  })

  it('sees through a trailing dot rather than treating it as a hostname', () => {
    // `http://127.0.0.1./` is the root-label form. Reading it as a DNS name would send it to
    // resolution instead of the range check, which is a bypass.
    expect([...parseIpv4('127.0.0.1.')!.bytes]).toEqual([127, 0, 0, 1])
    expect([...parseIpv4('1.2.3.')!.bytes]).toEqual([1, 2, 0, 3])
  })

  it('reads IPv6, compressed and bracketed and IPv4-mapped', () => {
    expect([...parseIpv6('[::1]')!.bytes].at(-1)).toBe(1)
    expect(parseIpv6('::')).not.toBeNull()
    // The form WHATWG produces for ::ffff:127.0.0.1, and the form a player would type.
    expect([...parseIpv6('::ffff:7f00:1')!.bytes].slice(12)).toEqual([127, 0, 0, 1])
    expect([...parseIpv6('::ffff:127.0.0.1')!.bytes].slice(12)).toEqual([127, 0, 0, 1])
    expect(parseIpv6('fd00:ec2::254')).not.toBeNull()
    expect(parseIpv6('gggg::1')).toBeNull()
    expect(parseIpv6('::1::2')).toBeNull()
  })
})

describe('blocked ranges', () => {
  const blocked = [
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254', // AWS/GCP/Azure instance metadata
    '172.16.0.1',
    '172.31.255.254',
    '192.0.0.1',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '203.0.113.1',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    '::ffff:127.0.0.1', // IPv4-mapped loopback
    '::ffff:169.254.169.254',
    '64:ff9b::127.0.0.1', // NAT64-wrapped loopback
    'fd00:ec2::254', // AWS IMDS over IPv6
    'fc00::1',
    'fe80::1',
    'ff02::1',
    '2001:db8::1',
  ]

  it.each(blocked)('refuses %s', (address) => {
    const parsed = parseAddress(address)
    expect(parsed, address).not.toBeNull()
    expect(isBlockedAddress(parsed!), address).toBe(true)
  })

  const allowed = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111', '2001:4860::8888']

  it.each(allowed)('allows %s', (address) => {
    const parsed = parseAddress(address)
    expect(parsed, address).not.toBeNull()
    expect(isBlockedAddress(parsed!), address).toBe(false)
  })
})

describe('assertSafeUrl', () => {
  it('speaks only http and https', () => {
    expect(refusalFor('file:///etc/passwd')).toBe('scheme')
    expect(refusalFor('gopher://example.com/')).toBe('scheme')
    expect(refusalFor('ftp://example.com/')).toBe('scheme')
    expect(refusalFor('data:text/html,<script>alert(1)</script>')).toBe('scheme')
    expect(refusalFor('javascript:alert(1)')).toBe('scheme')
    expect(refusalFor('blob:https://example.com/abc')).toBe('scheme')
  })

  it('will not carry credentials', () => {
    expect(refusalFor('https://user:pass@example.com/')).toBe('credentials')
    expect(refusalFor('https://user@example.com/')).toBe('credentials')
  })

  it('refuses private addresses however they are written', () => {
    // WHATWG normalises the integer forms; the parser is checked directly above so this proves
    // the whole path, not just the parser.
    for (const url of [
      'http://127.0.0.1/',
      'http://2130706433/',
      'http://0177.0.0.1/',
      'http://0x7f.0.0.1/',
      'http://[::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://10.0.0.1/',
      'http://192.168.1.1/',
      'http://[fd00:ec2::254]/',
    ]) {
      expect(refusalFor(url), url).toBe('private-address')
    }
  })

  it('refuses the metadata endpoint by address and by name', () => {
    expect(refusalFor('http://169.254.169.254/latest/meta-data/')).toBe('private-address')
    expect(refusalFor('http://metadata.google.internal/computeMetadata/v1/')).toBe(
      'metadata-endpoint',
    )
    expect(refusalFor('http://metadata/')).toBe('metadata-endpoint')
  })

  it('will not call back into this machine', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://twothousandnine.example')
    expect(refusalFor('https://twothousandnine.example/api/timelines/x')).toBe('own-origin')
    // A trailing dot is the classic way past a naive host comparison.
    expect(refusalFor('https://twothousandnine.example./api/timelines/x')).toBe('own-origin')
    vi.unstubAllEnvs()
  })

  it('lets an ordinary public address through', () => {
    expect(refusalFor('https://example.com/article')).toBeNull()
    expect(assertSafeUrl('https://example.com/a?b=c#d').toString()).toBe(
      'https://example.com/a?b=c#d',
    )
  })
})

describe('safeFetch', () => {
  const publicResolve = async () => {}

  function response(init: {
    status?: number
    headers?: Record<string, string>
    body?: string
  }): Response {
    return new Response(init.body ?? '', {
      status: init.status ?? 200,
      headers: { 'content-type': 'text/html', ...init.headers },
    })
  }

  it('validates every hop, not just the first', async () => {
    const seen: string[] = []
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      seen.push(url)
      if (url === 'https://example.com/')
        return response({ status: 302, headers: { location: 'http://127.0.0.1/admin' } })
      return response({ body: 'should never be reached' })
    }) as unknown as typeof fetch

    // A permitted host that redirects into the private network is the entire attack.
    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve }),
    ).rejects.toMatchObject({ refusal: 'private-address' })
    expect(seen).toEqual(['https://example.com/'])
  })

  it('re-checks the scheme on a redirect', async () => {
    const fetchImpl = vi.fn(async () =>
      response({ status: 301, headers: { location: 'file:///etc/passwd' } }),
    ) as unknown as typeof fetch

    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve }),
    ).rejects.toMatchObject({ refusal: 'scheme' })
  })

  it('caps the redirect chain', async () => {
    let hop = 0
    const fetchImpl = vi.fn(async () => {
      hop += 1
      return response({ status: 302, headers: { location: `https://example.com/${hop}` } })
    }) as unknown as typeof fetch

    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve }),
    ).rejects.toMatchObject({ refusal: 'too-many-redirects' })
  })

  it('detects a redirect loop', async () => {
    const fetchImpl = vi.fn(async () =>
      response({ status: 302, headers: { location: 'https://example.com/' } }),
    ) as unknown as typeof fetch

    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve }),
    ).rejects.toMatchObject({ refusal: 'redirect-loop' })
  })

  it('reads pages, not downloads', async () => {
    const fetchImpl = vi.fn(async () =>
      response({ headers: { 'content-type': 'application/zip' }, body: 'PK' }),
    ) as unknown as typeof fetch

    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve }),
    ).rejects.toMatchObject({ refusal: 'content-type' })
  })

  it('enforces the size cap while streaming, not from the declared length', async () => {
    // The header lies; the body is 40 KB. Trusting content-length is the bug this proves absent.
    const body = 'x'.repeat(40_000)
    const fetchImpl = vi.fn(
      async () =>
        new Response(body, {
          status: 200,
          headers: { 'content-type': 'text/html', 'content-length': '10' },
        }),
    ) as unknown as typeof fetch

    await expect(
      safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve, maxBytes: 1_000 }),
    ).rejects.toMatchObject({ refusal: 'too-large' })
  })

  it('returns the body when everything checks out', async () => {
    const fetchImpl = vi.fn(async () =>
      response({ body: '<html><title>Hello</title><body>Hi</body></html>' }),
    ) as unknown as typeof fetch

    const result = await safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve })
    expect(result.status).toBe(200)
    expect(result.contentType).toBe('text/html')
    expect(result.body).toContain('Hello')
  })

  it('forwards no inbound header, cookie or credential', async () => {
    let init: RequestInit | undefined
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => {
      init = options
      return response({ body: 'ok' })
    }) as unknown as typeof fetch

    await safeFetch('https://example.com/', { fetchImpl, resolve: publicResolve })
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(Object.keys(headers).map((k) => k.toLowerCase())).toEqual(['accept', 'user-agent'])
    expect(init?.credentials).toBe('omit')
    expect(init?.redirect).toBe('manual')
    expect(init?.referrerPolicy).toBe('no-referrer')
  })

  it('refuses a host that resolves into the private network', async () => {
    const fetchImpl = vi.fn(async () => response({ body: 'ok' })) as unknown as typeof fetch
    const resolve = async () => {
      throw new WayUpRefused('private-address', 'that host points somewhere private')
    }
    await expect(
      safeFetch('https://rebind.example/', { fetchImpl, resolve }),
    ).rejects.toMatchObject({ refusal: 'private-address' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('rate limiting', () => {
  beforeEach(() => __resetRateLimits())

  it('allows a burst and then refuses', () => {
    let last = rateLimit('user:a', 0)
    for (let i = 1; i < 12; i += 1) last = rateLimit('user:a', 0)
    expect(last.ok).toBe(true)
    expect(last.remaining).toBe(0)

    const refused = rateLimit('user:a', 0)
    expect(refused.ok).toBe(false)
    expect(refused.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keeps callers apart, and forgets after the window', () => {
    for (let i = 0; i < 12; i += 1) rateLimit('user:a', 0)
    expect(rateLimit('user:a', 0).ok).toBe(false)
    expect(rateLimit('user:b', 0).ok).toBe(true)
    expect(rateLimit('user:a', 60_001).ok).toBe(true)
  })

  it('identifies a signed-in player by account and a guest by address', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.9, 70.41.3.18' },
    })
    expect(rateLimitKey(request, 'u1')).toBe('user:u1')
    // The first entry is the client; the rest are proxies.
    expect(rateLimitKey(request, null)).toBe('ip:203.0.113.9')
  })
})

describe('snapshots are immutable values', () => {
  const doc = {
    canonicalUrl: 'https://example.com/a',
    title: 'A',
    text: '# Heading\n\nA paragraph.',
    links: [{ label: 'example.com/b', url: 'https://example.com/b' }],
    remoteFetchedAt: '2026-09-08T00:00:00.000Z',
  }

  it('hashes content, not the moment of capture', () => {
    const first = snapshotFrom(doc, 'test')
    const later = snapshotFrom({ ...doc, remoteFetchedAt: '2027-01-01T00:00:00.000Z' }, 'test')
    // Same page read a year apart is the same document, and the id says so.
    expect(later.contentHash).toBe(first.contentHash)
    expect(later.id).toBe(first.id)
  })

  it('gives a changed page a different id, which is the whole checksum mechanic', () => {
    const first = snapshotFrom(doc, 'test')
    const changed = snapshotFrom({ ...doc, text: '# Heading\n\nA different paragraph.' }, 'test')
    expect(changed.contentHash).not.toBe(first.contentHash)
    expect(changed.id).not.toBe(first.id)
    expect(changed.canonicalUrl).toBe(first.canonicalUrl)
  })

  it('is stable across processes', () => {
    // Nothing in the id depends on process state, so a snapshot captured today and one captured
    // on another instance agree — which is what lets a save reference one by id.
    const blocks = toBlocks('# Heading\n\nA paragraph.')
    const hash = contentHashOf('https://example.com/a', 'A', blocks)
    expect(snapshotIdFor('https://example.com/a', hash)).toBe(snapshotFrom(doc, 'test').id)
    expect(snapshotFrom(doc, 'test').id).toMatch(/^wu_[0-9a-f]{32}$/)
  })

  it('turns text into blocks the renderer knows, and nothing else', () => {
    const blocks = toBlocks(
      '# Title\n\nA paragraph.\n\n> Quoted\n\n- one\n- two\n\n---\n\n```\ncode\n```',
    )
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'p', 'quote', 'list', 'rule', 'code'])
  })
})

describe('remote markup never survives extraction', () => {
  it('drops scripts and styles and returns text', () => {
    const html = [
      '<html><head><title>Live &amp; Real</title><style>body{color:red}</style></head>',
      '<body><script>fetch("/steal")</script><p>First</p><p>Second</p>',
      '<a href="/next">Next</a><a href="javascript:alert(1)">Bad</a></body></html>',
    ].join('')

    const { title, text, links } = extractFromHtml(html, 'https://example.com/page')
    expect(title).toBe('Live & Real')
    expect(text).not.toContain('fetch(')
    expect(text).not.toContain('color:red')
    expect(text).not.toContain('<')
    expect(text).toContain('First')
    expect(text).toContain('Second')

    // Only http(s) links survive, so a javascript: href cannot reach the renderer at all.
    expect(links.map((l) => l.url)).toEqual(['https://example.com/next'])
  })

  it('produces no block kind outside the known union', () => {
    const { text } = extractFromHtml('<p><b>bold</b> and <i>italic</i></p>', 'https://example.com/')
    const kinds = new Set(toBlocks(text).map((b) => b.kind))
    for (const kind of kinds) {
      expect(['heading', 'p', 'quote', 'list', 'code', 'rule']).toContain(kind)
    }
  })
})

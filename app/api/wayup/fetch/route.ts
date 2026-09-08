import { NextResponse } from 'next/server'
import { reportError } from '@/lib/errors'
import { recallSnapshot, rememberSnapshot, snapshotFrom } from '@/lib/wayup/cache'
import { getProvider } from '@/lib/wayup/provider'
import { assertSafeUrl, rateLimit, rateLimitKey } from '@/lib/wayup/security'
import { WayUpRefused } from '@/lib/wayup/types'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4 * 1024
const MAX_URL_CHARS = 2_048
const TIMEOUT_MS = 20_000

/**
 * Captures one remote page as an immutable snapshot.
 *
 * The response is the snapshot itself, not a stream of the remote page: the client is handed
 * normalised text blocks it renders with HALCYON's own renderer, and never markup it could
 * inject. Whatever the other side sends, the game's origin only ever sees data.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()
  const limit = rateLimit(rateLimitKey(request, user?.id ?? null))
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'the signal needs a moment' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that address is too long' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that address is too long' }, { status: 413 })
  }

  let url: string
  try {
    const body = JSON.parse(raw) as { url?: unknown }
    url = typeof body.url === 'string' ? body.url.trim().slice(0, MAX_URL_CHARS) : ''
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }

  // Refused before anything is dialled: scheme, credentials, literal private addresses, and our
  // own origin.
  let safe: URL
  try {
    safe = assertSafeUrl(url)
  } catch (error) {
    if (error instanceof WayUpRefused) {
      return NextResponse.json({ error: error.message, refusal: error.refusal }, { status: 400 })
    }
    return NextResponse.json({ error: 'that is not an address' }, { status: 400 })
  }

  const cached = recallSnapshot(safe.toString())
  if (cached) return NextResponse.json({ snapshot: cached, cached: true })

  const provider = getProvider()
  if (!provider) {
    return NextResponse.json({ error: 'the relay is not configured' }, { status: 503 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const document = await provider.fetch(safe.toString(), controller.signal)
    const snapshot = snapshotFrom(document, provider.name)
    rememberSnapshot(snapshot)
    return NextResponse.json({ snapshot, cached: false })
  } catch (error) {
    if (error instanceof WayUpRefused) {
      const status = error.refusal === 'too-large' || error.refusal === 'content-type' ? 415 : 400
      return NextResponse.json({ error: error.message, refusal: error.refusal }, { status })
    }
    // The URL is the player's own input, so it stays out of the report for the same reason their
    // Recall queries do.
    reportError(error, { scope: 'wayup.fetch' })
    return NextResponse.json({ error: 'the other side did not answer' }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}

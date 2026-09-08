import { NextResponse } from 'next/server'
import { reportError } from '@/lib/errors'
import { getProvider, isRelayConfigured } from '@/lib/wayup/provider'
import { rateLimit, rateLimitKey } from '@/lib/wayup/security'
import { WayUpRefused, type WayUpSearchResponse } from '@/lib/wayup/types'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * A query is a sentence, not a payload. Anything longer than this is either a mistake or an
 * attempt to make the provider do something expensive on our account.
 */
const MAX_BODY_BYTES = 4 * 1024
const MAX_QUERY_CHARS = 256
const TIMEOUT_MS = 15_000

export async function POST(request: Request) {
  if (!isRelayConfigured()) {
    // The house pattern: every service degrades to a clean "not configured" rather than a stack
    // trace. Search needs an index; there is no fallback that invents one.
    return NextResponse.json({ error: 'the relay has no index on this side' }, { status: 503 })
  }

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
    return NextResponse.json({ error: 'that query is too long' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that query is too long' }, { status: 413 })
  }

  let query: string
  try {
    const body = JSON.parse(raw) as { query?: unknown }
    query = typeof body.query === 'string' ? body.query.trim().slice(0, MAX_QUERY_CHARS) : ''
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }
  if (query.length === 0) {
    return NextResponse.json({ error: 'nothing to look for' }, { status: 400 })
  }

  const provider = getProvider()
  if (!provider) {
    return NextResponse.json({ error: 'the relay is not configured' }, { status: 503 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const results = await provider.search(query, controller.signal)
    const payload: WayUpSearchResponse = { query, results, provider: provider.name }
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof WayUpRefused) {
      return NextResponse.json({ error: error.message, refusal: error.refusal }, { status: 400 })
    }
    // The query itself is never included: freeform player text does not leave the device, and an
    // error report is still a place text can leak to.
    reportError(error, { scope: 'wayup.search' })
    return NextResponse.json({ error: 'the other side did not answer' }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}

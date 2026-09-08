import { NextResponse } from 'next/server'
import { StoredTimelineSchema } from '@/engine/timeline-schema'
import { migrateStored } from '@/lib/persistence/migrations'
import type { StoredTimeline } from '@/lib/persistence/types'
import { loadServerTimeline, upsertServerTimeline } from '@/lib/supabase/timelines'
import { getCurrentUser } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

interface Ctx {
  params: Promise<{ id: string }>
}

/**
 * A completed Day 01 save measures about 8 KB. This is sixty times that, which leaves room for
 * thirty days of play and still refuses to be a file host — the request body is read as text so
 * an oversized payload is rejected before it is ever parsed.
 */
const MAX_BODY_BYTES = 512 * 1024

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })
  const stored = await loadServerTimeline(id, user.id)
  if (!stored) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ timeline: stored })
}

/** Claims a local guest timeline for the signed-in player, or syncs an existing one. */
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that timeline is too large to save' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that timeline is too large to save' }, { status: 413 })
  }

  try {
    const body = JSON.parse(raw) as { timeline?: unknown }
    // Migrate first — an older client is legitimate — then validate the result. Without this the
    // whole snapshot was attacker-shaped: the schema is the only thing standing between a
    // handwritten JSON body and a jsonb column.
    const migrated = migrateStored(body.timeline)
    const parsed = StoredTimelineSchema.safeParse(migrated)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'that save is not a valid timeline', issues: parsed.error.issues.slice(0, 5) },
        { status: 422 },
      )
    }
    if (parsed.data.id !== id) {
      return NextResponse.json({ error: 'timeline id mismatch' }, { status: 400 })
    }

    // Event payloads keep their loose shape through validation — the reducer's exhaustive
    // switch is what interprets them, and an unknown variant now leaves state untouched.
    const timeline = parsed.data as unknown as StoredTimeline
    const result = await upsertServerTimeline(timeline, user.id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    reportError(error, { scope: 'timelines.put', timelineId: id })
    return NextResponse.json({ error: 'could not save the timeline' }, { status: 400 })
  }
}

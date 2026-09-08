import { NextResponse } from 'next/server'
import { migrateStored } from '@/lib/persistence/migrations'
import { loadServerTimeline, upsertServerTimeline } from '@/lib/supabase/timelines'
import { getCurrentUser } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

interface Ctx {
  params: Promise<{ id: string }>
}

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

  try {
    const body = (await request.json()) as { timeline?: unknown }
    const stored = migrateStored(body.timeline)
    if (stored.id !== id) {
      return NextResponse.json({ error: 'timeline id mismatch' }, { status: 400 })
    }
    const result = await upsertServerTimeline(stored, user.id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    reportError(error, { scope: 'timelines.put', timelineId: id })
    return NextResponse.json({ error: 'could not save the timeline' }, { status: 400 })
  }
}

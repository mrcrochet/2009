import { NextResponse } from 'next/server'
import { StoredInvestigationSchema } from '@/engine/investigation-schema'
import { migrateStored } from '@/lib/persistence/migrations'
import type { StoredInvestigation } from '@/lib/persistence/types'
import { loadServerInvestigation, upsertServerInvestigation } from '@/lib/supabase/investigations'
import { getCurrentUser } from '@/lib/supabase/server'
import { reportError } from '@/lib/errors'

interface Ctx {
  params: Promise<{ id: string }>
}

/**
 * A completed Case 001 save measures about 8 KB. This is sixty times that, which leaves room for
 * a long sitting and still refuses to be a file host — the request body is read as text so
 * an oversized payload is rejected before it is ever parsed.
 */
const MAX_BODY_BYTES = 512 * 1024

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })
  const stored = await loadServerInvestigation(id, user.id)
  if (!stored) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ investigation: stored })
}

/** Claims a local guest investigation for the signed-in player, or syncs an existing one. */
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that investigation is too large to save' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'could not read the request' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'that investigation is too large to save' }, { status: 413 })
  }

  try {
    const body = JSON.parse(raw) as { investigation?: unknown }
    // Migrate first — an older client is legitimate — then validate the result. Without this the
    // whole snapshot was attacker-shaped: the schema is the only thing standing between a
    // handwritten JSON body and a jsonb column.
    const migrated = migrateStored(body.investigation)
    const parsed = StoredInvestigationSchema.safeParse(migrated)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'that save is not a valid investigation',
          issues: parsed.error.issues.slice(0, 5),
        },
        { status: 422 },
      )
    }
    if (parsed.data.id !== id) {
      return NextResponse.json({ error: 'investigation id mismatch' }, { status: 400 })
    }

    // Event payloads keep their loose shape through validation — the reducer's exhaustive
    // switch is what interprets them, and an unknown variant now leaves state untouched.
    const investigation = parsed.data as unknown as StoredInvestigation
    const result = await upsertServerInvestigation(investigation, user.id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    reportError(error, { scope: 'investigations.put', investigationId: id })
    return NextResponse.json({ error: 'could not save the investigation' }, { status: 400 })
  }
}

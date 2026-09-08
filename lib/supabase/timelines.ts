import type { StoredTimeline } from '@/lib/persistence/types'
import { migrateStored } from '@/lib/persistence/migrations'
import { reportError } from '@/lib/errors'
import { createServerSupabase } from './server'

interface TimelineRow {
  id: string
  user_id: string | null
  schema_version: number
  day: number
  snapshot: unknown
  last_event_seq: number
  created_at: string
  updated_at: string
}

function rowToStored(row: TimelineRow): StoredTimeline | null {
  try {
    return migrateStored(row.snapshot)
  } catch (error) {
    reportError(error, { scope: 'supabase.timeline.migrate', timelineId: row.id })
    return null
  }
}

export async function loadServerTimeline(
  timelineId: string,
  userId: string,
): Promise<StoredTimeline | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('id', timelineId)
    .eq('user_id', userId)
    .maybeSingle<TimelineRow>()
  if (error || !data) return null
  return rowToStored(data)
}

export async function listServerTimelines(userId: string): Promise<StoredTimeline[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20)
  if (error || !data) return []
  return (data as TimelineRow[]).flatMap((row) => {
    const stored = rowToStored(row)
    return stored ? [stored] : []
  })
}

/** One-way claim: a guest timeline becomes the signed-in player's, then the server owns it. */
export async function upsertServerTimeline(
  stored: StoredTimeline,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false, error: 'cloud saves are not configured' }
  const { error } = await supabase.from('timelines').upsert(
    {
      id: stored.id,
      user_id: userId,
      schema_version: stored.schemaVersion,
      day: stored.day,
      snapshot: { ...stored, ownerId: userId },
      last_event_seq: stored.events.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

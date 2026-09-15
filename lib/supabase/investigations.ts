import type { StoredInvestigation } from '@/lib/persistence/types'
import { migrateStored } from '@/lib/persistence/migrations'
import { reportError } from '@/lib/errors'
import { createServerSupabase } from './server'

interface InvestigationRow {
  id: string
  user_id: string | null
  schema_version: number
  case_id: string
  snapshot: unknown
  last_event_seq: number
  created_at: string
  updated_at: string
}

function rowToStored(row: InvestigationRow): StoredInvestigation | null {
  try {
    return migrateStored(row.snapshot)
  } catch (error) {
    reportError(error, { scope: 'supabase.investigation.migrate', investigationId: row.id })
    return null
  }
}

/**
 * Just the case, for the entitlement gate.
 *
 * Fetching and migrating a whole snapshot to read one identifier is what turns a large save into
 * a per-request cost.
 */
export async function loadServerInvestigationCase(
  investigationId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('timelines')
    .select('case_id')
    .eq('id', investigationId)
    .eq('user_id', userId)
    .maybeSingle<{ case_id: string }>()
  if (error || !data) return null
  return data.case_id
}

export async function loadServerInvestigation(
  investigationId: string,
  userId: string,
): Promise<StoredInvestigation | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('id', investigationId)
    .eq('user_id', userId)
    .maybeSingle<InvestigationRow>()
  if (error || !data) return null
  return rowToStored(data)
}

export async function listServerInvestigations(userId: string): Promise<StoredInvestigation[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20)
  if (error || !data) return []
  return (data as InvestigationRow[]).flatMap((row) => {
    const stored = rowToStored(row)
    return stored ? [stored] : []
  })
}

/** One-way claim: a guest investigation becomes the signed-in player's, then the server owns it. */
export async function upsertServerInvestigation(
  stored: StoredInvestigation,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false, error: 'cloud saves are not configured' }
  const { error } = await supabase.from('timelines').upsert(
    {
      id: stored.id,
      user_id: userId,
      schema_version: stored.schemaVersion,
      case_id: stored.caseId,
      snapshot: { ...stored, ownerId: userId },
      last_event_seq: stored.events.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

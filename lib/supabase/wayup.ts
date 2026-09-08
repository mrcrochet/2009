import type { WayUpBlock, WayUpLink, WayUpSnapshot } from '@/lib/wayup/types'
import { reportError } from '@/lib/errors'
import { createAdminClient } from './admin'
import { createServerSupabase } from './server'

/**
 * Persistence for the Way Up Machine.
 *
 * Two clients, on purpose. Snapshots and visits are written with the service role because the
 * relay route is the only thing that has actually fetched a page — a client-writable cache
 * would let one player author a document another player reads inside the game's own renderer.
 * Everything a player legitimately authors themselves (pinning an excerpt, recording an unlock)
 * goes through their own session, where RLS does the checking.
 *
 * Nothing here throws and nothing assumes Supabase is configured: a guest keeps their Way Up
 * history in IndexedDB and never touches any of this.
 */

// ------------------------------------------------------------------- rows

interface SnapshotRow {
  id: string
  canonical_url: string
  content_hash: string
  title: string
  remote_fetched_at: string
  blocks: unknown
  outgoing_links: unknown
  provider: string
  byte_length: number
  screenshot_path: string | null
  created_at: string
}

function rowToSnapshot(row: SnapshotRow): WayUpSnapshot {
  return {
    id: row.id,
    canonicalUrl: row.canonical_url,
    title: row.title,
    remoteFetchedAt: row.remote_fetched_at,
    contentHash: row.content_hash,
    blocks: (Array.isArray(row.blocks) ? row.blocks : []) as readonly WayUpBlock[],
    outgoingLinks: (Array.isArray(row.outgoing_links) ? row.outgoing_links : []) as WayUpLink[],
    provider: row.provider,
    byteLength: row.byte_length,
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

const NOT_CONFIGURED = 'the Way Up relay is not configured'

// --------------------------------------------------------------- snapshots

/**
 * Stores a capture, or returns the existing one. The id is derived from the URL and the content
 * hash, so re-capturing an unchanged page is a no-op and a changed page is a new row — which is
 * exactly what the checksum beat compares.
 */
export async function recordSnapshot(
  snapshot: WayUpSnapshot,
  screenshotPath: string | null = null,
): Promise<Result<string>> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, error: NOT_CONFIGURED }

  const { error } = await admin.from('wayup_snapshots').upsert(
    {
      id: snapshot.id,
      canonical_url: snapshot.canonicalUrl,
      content_hash: snapshot.contentHash,
      title: snapshot.title,
      remote_fetched_at: snapshot.remoteFetchedAt,
      blocks: snapshot.blocks,
      outgoing_links: snapshot.outgoingLinks,
      provider: snapshot.provider,
      byte_length: snapshot.byteLength,
      screenshot_path: screenshotPath,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  if (error) {
    reportError(error, { scope: 'wayup.snapshot.record', snapshotId: snapshot.id })
    return { ok: false, error: error.message }
  }
  return { ok: true, value: snapshot.id }
}

/**
 * Reads a snapshot the player has actually visited. RLS does the enforcing — an id alone is not
 * enough, so this returns null for anything their timelines never opened.
 */
export async function loadVisitedSnapshot(snapshotId: string): Promise<WayUpSnapshot | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('wayup_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .maybeSingle<SnapshotRow>()
  if (error || !data) return null
  return rowToSnapshot(data)
}

/**
 * The relay's own cache lookup, before it spends a real fetch. Runs as the service role because
 * it must see snapshots this player has never visited — that is the whole point of a cache.
 */
export async function findCachedSnapshot(canonicalUrl: string): Promise<WayUpSnapshot | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const { data, error } = await admin
    .from('wayup_snapshots')
    .select('*')
    .eq('canonical_url', canonicalUrl)
    .order('remote_fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle<SnapshotRow>()
  if (error || !data) return null
  return rowToSnapshot(data)
}

// ------------------------------------------------------------------ visits

export interface VisitInput {
  readonly timelineId: string
  readonly snapshotId: string
  readonly openedGameDay: number
  readonly openedGameMinute: number
  readonly signalCost: number
}

/**
 * Records that a timeline opened a page. Service-role only, and not an oversight: a visit row is
 * what grants read access to a snapshot, so a client able to forge one could read any snapshot
 * id it could guess.
 */
export async function recordVisit(visit: VisitInput): Promise<Result<null>> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await admin.from('timeline_wayup_visits').insert({
    timeline_id: visit.timelineId,
    snapshot_id: visit.snapshotId,
    opened_game_day: visit.openedGameDay,
    opened_game_minute: visit.openedGameMinute,
    signal_cost: visit.signalCost,
  })
  if (error) {
    reportError(error, { scope: 'wayup.visit.record', timelineId: visit.timelineId })
    return { ok: false, error: error.message }
  }
  return { ok: true, value: null }
}

// --------------------------------------------------------- future evidence

/**
 * An excerpt pinned from a page of the future, with its provenance.
 *
 * The URL, the remote fetch time and the content hash come from the joined snapshot rather than
 * from columns of their own: the client cannot write a snapshot, so reading them through the
 * join is the difference between provenance and a claim about provenance.
 */
export interface FutureEvidence {
  readonly id: string
  readonly snapshotId: string
  readonly excerpt: string
  readonly excerptHash: string
  readonly capturedGameDay: number
  readonly capturedGameMinute: number
  readonly pinnedAt: string
  readonly sourceUrl: string
  readonly remoteFetchedAt: string
  readonly contentHash: string
  readonly sourceTitle: string
}

interface FutureEvidenceRow {
  id: string
  snapshot_id: string
  excerpt: string
  excerpt_hash: string
  captured_game_day: number
  captured_game_minute: number
  pinned_at: string
  wayup_snapshots: {
    canonical_url: string
    remote_fetched_at: string
    content_hash: string
    title: string
  } | null
}

export interface PinInput {
  readonly timelineId: string
  readonly snapshotId: string
  readonly excerpt: string
  readonly excerptHash: string
  readonly capturedGameDay: number
  readonly capturedGameMinute: number
}

export async function pinFutureEvidence(pin: PinInput): Promise<Result<null>> {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await supabase.from('future_evidence').insert({
    timeline_id: pin.timelineId,
    snapshot_id: pin.snapshotId,
    excerpt: pin.excerpt,
    excerpt_hash: pin.excerptHash,
    captured_game_day: pin.capturedGameDay,
    captured_game_minute: pin.capturedGameMinute,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, value: null }
}

export async function listFutureEvidence(timelineId: string): Promise<FutureEvidence[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('future_evidence')
    .select(
      'id, snapshot_id, excerpt, excerpt_hash, captured_game_day, captured_game_minute, pinned_at, wayup_snapshots(canonical_url, remote_fetched_at, content_hash, title)',
    )
    .eq('timeline_id', timelineId)
    .order('pinned_at', { ascending: false })
    .limit(256)

  if (error || !data) return []
  return (data as unknown as FutureEvidenceRow[]).map((row) => ({
    id: row.id,
    snapshotId: row.snapshot_id,
    excerpt: row.excerpt,
    excerptHash: row.excerpt_hash,
    capturedGameDay: row.captured_game_day,
    capturedGameMinute: row.captured_game_minute,
    pinnedAt: row.pinned_at,
    sourceUrl: row.wayup_snapshots?.canonical_url ?? '',
    remoteFetchedAt: row.wayup_snapshots?.remote_fetched_at ?? '',
    contentHash: row.wayup_snapshots?.content_hash ?? '',
    sourceTitle: row.wayup_snapshots?.title ?? '',
  }))
}

export async function unpinFutureEvidence(evidenceId: string): Promise<Result<null>> {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await supabase.from('future_evidence').delete().eq('id', evidenceId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, value: null }
}

// ---------------------------------------------------------------- mysteries

export interface MysteryUnlock {
  readonly mysteryId: string
  readonly sourceEvent: string
  readonly unlockedAt: string
}

export async function unlockMystery(
  timelineId: string,
  mysteryId: string,
  sourceEvent: string,
): Promise<Result<null>> {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await supabase
    .from('mystery_unlocks')
    .upsert(
      { timeline_id: timelineId, mystery_id: mysteryId, source_event: sourceEvent },
      { onConflict: 'timeline_id,mystery_id', ignoreDuplicates: true },
    )
  if (error) return { ok: false, error: error.message }
  return { ok: true, value: null }
}

export async function listMysteryUnlocks(timelineId: string): Promise<MysteryUnlock[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('mystery_unlocks')
    .select('mystery_id, source_event, unlocked_at')
    .eq('timeline_id', timelineId)
    .limit(256)
  if (error || !data) return []
  return (data as { mystery_id: string; source_event: string; unlocked_at: string }[]).map(
    (row) => ({
      mysteryId: row.mystery_id,
      sourceEvent: row.source_event,
      unlockedAt: row.unlocked_at,
    }),
  )
}

// ----------------------------------------------------------- global mystery

export interface GlobalMystery {
  readonly mysteryId: string
  readonly fragmentsFound: number
  readonly fragmentsRequired: number
  readonly resolvedAt: string | null
}

/** Readable by anyone, including a guest with no account. "7 / 9" is the point. */
export async function readGlobalMysteries(): Promise<GlobalMystery[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('global_mystery_state')
    .select('mystery_id, fragments_found, fragments_required, resolved_at')
    .limit(64)
  if (error || !data) return []
  return (
    data as {
      mystery_id: string
      fragments_found: number
      fragments_required: number
      resolved_at: string | null
    }[]
  ).map((row) => ({
    mysteryId: row.mystery_id,
    fragmentsFound: row.fragments_found,
    fragmentsRequired: row.fragments_required,
    resolvedAt: row.resolved_at,
  }))
}

/**
 * Adds one account's fragment and recomputes the public count. Service-role only, and the
 * primary key limits an account to one contribution per mystery — the aggregate is derived from
 * the ledger rather than incremented, so a replayed call cannot inflate it.
 */
export async function contributeFragment(
  mysteryId: string,
  fragmentId: string,
  userId: string,
  timelineId: string | null,
): Promise<Result<GlobalMystery | null>> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, error: NOT_CONFIGURED }

  const { error: insertError } = await admin.from('global_mystery_fragments').upsert(
    {
      mystery_id: mysteryId,
      fragment_id: fragmentId,
      user_id: userId,
      timeline_id: timelineId,
    },
    { onConflict: 'mystery_id,user_id', ignoreDuplicates: true },
  )
  if (insertError) {
    reportError(insertError, { scope: 'wayup.fragment.contribute', mysteryId })
    return { ok: false, error: insertError.message }
  }

  const { count, error: countError } = await admin
    .from('global_mystery_fragments')
    .select('*', { count: 'exact', head: true })
    .eq('mystery_id', mysteryId)
  if (countError) return { ok: false, error: countError.message }

  const { data, error: updateError } = await admin
    .from('global_mystery_state')
    .update({ fragments_found: count ?? 0, updated_at: new Date().toISOString() })
    .eq('mystery_id', mysteryId)
    .select('mystery_id, fragments_found, fragments_required, resolved_at')
    .maybeSingle<{
      mystery_id: string
      fragments_found: number
      fragments_required: number
      resolved_at: string | null
    }>()
  if (updateError) return { ok: false, error: updateError.message }
  if (!data) return { ok: true, value: null }

  return {
    ok: true,
    value: {
      mysteryId: data.mystery_id,
      fragmentsFound: data.fragments_found,
      fragmentsRequired: data.fragments_required,
      resolvedAt: data.resolved_at,
    },
  }
}

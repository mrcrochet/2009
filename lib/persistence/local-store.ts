import type { InvestigationState } from '@/engine/types'
import { reportError } from '@/lib/errors'
import { getDb } from './db'
import { rememberInvestigationId } from './last-investigation'
import { MigrationError, migrateStored } from './migrations'
import { fromStored, toStored, type StoredInvestigation } from './types'

/**
 * Local persistence is best-effort by design: a private window with IndexedDB disabled must
 * still be able to play Day 01 from start to finish.
 */

export async function saveInvestigation(state: InvestigationState): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  try {
    await db.timelines.put(toStored(state))
    rememberInvestigationId(state.id)
    return true
  } catch (error) {
    reportError(error, { scope: 'persistence.save', timelineId: state.id })
    return false
  }
}

export async function loadInvestigation(id: string): Promise<InvestigationState | null> {
  const db = await getDb()
  if (!db) return null
  try {
    const raw = await db.timelines.get(id)
    if (!raw) return null
    return fromStored(migrateStored(raw))
  } catch (error) {
    if (error instanceof MigrationError) {
      await quarantine(id, error)
      return null
    }
    reportError(error, { scope: 'persistence.load', timelineId: id })
    return null
  }
}

export async function listInvestigations(): Promise<StoredInvestigation[]> {
  const db = await getDb()
  if (!db) return []
  try {
    const rows = await db.timelines.orderBy('updatedAt').reverse().toArray()
    return rows.flatMap((row) => {
      try {
        return [migrateStored(row)]
      } catch {
        return []
      }
    })
  } catch (error) {
    reportError(error, { scope: 'persistence.list' })
    return []
  }
}

export async function deleteInvestigation(id: string): Promise<void> {
  const db = await getDb()
  if (!db) return
  try {
    await db.timelines.delete(id)
  } catch (error) {
    reportError(error, { scope: 'persistence.delete', timelineId: id })
  }
}

async function quarantine(id: string, error: MigrationError): Promise<void> {
  const db = await getDb()
  if (!db) return
  try {
    const raw = await db.timelines.get(id)
    await db.quarantine.put({
      id,
      raw: JSON.stringify(raw ?? null),
      reason: error.message,
      at: new Date().toISOString(),
    })
    await db.timelines.delete(id)
  } catch {
    /* quarantining is a courtesy, not a requirement */
  }
}

/** Debounced autosave. Returns a disposer so the shell can flush on unmount. */
export function createAutosave(delayMs = 600): {
  schedule(state: InvestigationState): void
  flush(): Promise<void>
  dispose(): void
} {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: InvestigationState | null = null

  const run = async () => {
    timer = null
    const state = pending
    pending = null
    if (state) await saveInvestigation(state)
  }

  return {
    schedule(state) {
      pending = state
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void run(), delayMs)
    },
    async flush() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      await run()
    },
    dispose() {
      if (timer) clearTimeout(timer)
      timer = null
      pending = null
    },
  }
}

export { lastInvestigationId } from './last-investigation'

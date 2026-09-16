import type DexieType from 'dexie'
import type { Table } from 'dexie'
import type { StoredInvestigation } from './types'

/**
 * Guest saves. Local-first: a player never needs an account to keep the case they are working.
 *
 * Dexie is the largest single dependency in the game bundle and nothing needs it until the first
 * autosave — 600 ms after the player's first action at the earliest — so it is imported on
 * demand rather than sitting on the critical path to the boot screen.
 */

const DB_NAME = 'unlisted'
/** What the store was called when this repository was a different product. */
const LEGACY_DB = 'two009'

export interface InvestigationDatabase {
  investigations: Table<StoredInvestigation, string>
  quarantine: Table<{ id: string; raw: string; reason: string; at: string }, string>
}

let db: InvestigationDatabase | null = null
let opening: Promise<InvestigationDatabase | null> | null = null

export function getDb(): Promise<InvestigationDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined')
    return Promise.resolve(null)
  if (db) return Promise.resolve(db)
  if (opening) return opening

  opening = import('dexie')
    .then(async ({ default: Dexie }) => {
      const instance = new Dexie(DB_NAME) as DexieType & InvestigationDatabase
      instance.version(1).stores({
        // `day` was an index on a field of the old product. A case is identified by name.
        investigations: 'id, updatedAt, ownerId, caseId',
        quarantine: 'id, at',
      })
      await carryForward(Dexie, instance)
      db = instance
      return db
    })
    .catch(() => null)

  return opening
}

/**
 * Moves whatever is in the old database into this one, once, and then removes it.
 *
 * A database cannot be renamed — only replaced — so without this, renaming the store away from
 * the old product's name would quietly abandon a save somebody is in the middle of. Whether the
 * rows are readable is not decided here: they are copied as they are, and `migrateStored`
 * quarantines the ones that came from a game that no longer exists.
 *
 * Failure is survivable by construction. If any of this throws, the new database is still open
 * and empty, which is exactly where the player would have been had this never run.
 */
async function carryForward(
  Dexie: typeof DexieType,
  next: DexieType & InvestigationDatabase,
): Promise<void> {
  let legacy: DexieType | null = null
  try {
    if (!(await Dexie.exists(LEGACY_DB))) return
    legacy = new Dexie(LEGACY_DB)
    legacy.version(1).stores({ timelines: 'id, updatedAt, ownerId, day', quarantine: 'id, at' })
    await legacy.open()
    const rows = (await legacy.table('timelines').toArray()) as StoredInvestigation[]
    if (rows.length > 0) await next.investigations.bulkPut(rows)
    legacy.close()
    legacy = null
    await Dexie.delete(LEGACY_DB)
  } catch {
    /* the old store is gone, unreadable, or was never there; the new one is what matters */
    legacy?.close()
  }
}

import type DexieType from 'dexie'
import type { Table } from 'dexie'
import type { StoredTimeline } from './types'

/**
 * Guest saves. Local-first: a player never needs an account to keep their Day 01.
 *
 * Dexie is the largest single dependency in the game bundle and nothing needs it until the first
 * autosave — 600 ms after the player's first action at the earliest — so it is imported on
 * demand rather than sitting on the critical path to the boot screen.
 */

export interface TimelineDatabase {
  timelines: Table<StoredTimeline, string>
  quarantine: Table<{ id: string; raw: string; reason: string; at: string }, string>
}

let db: TimelineDatabase | null = null
let opening: Promise<TimelineDatabase | null> | null = null

export function getDb(): Promise<TimelineDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined')
    return Promise.resolve(null)
  if (db) return Promise.resolve(db)
  if (opening) return opening

  opening = import('dexie')
    .then(({ default: Dexie }) => {
      const instance = new Dexie('two009') as DexieType & TimelineDatabase
      instance.version(1).stores({
        timelines: 'id, updatedAt, ownerId, day',
        quarantine: 'id, at',
      })
      db = instance
      return db
    })
    .catch(() => null)

  return opening
}

import Dexie, { type Table } from 'dexie'
import type { StoredTimeline } from './types'

/** Guest saves. Local-first: a player never needs an account to keep their Day 01. */
class TimelineDatabase extends Dexie {
  timelines!: Table<StoredTimeline, string>
  quarantine!: Table<{ id: string; raw: string; reason: string; at: string }, string>

  constructor() {
    super('two009')
    this.version(1).stores({
      timelines: 'id, updatedAt, ownerId, day',
      quarantine: 'id, at',
    })
  }
}

let db: TimelineDatabase | null = null

export function getDb(): TimelineDatabase | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null
  if (!db) {
    try {
      db = new TimelineDatabase()
    } catch {
      return null
    }
  }
  return db
}

export type { TimelineDatabase }

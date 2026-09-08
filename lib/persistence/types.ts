import type { GameEvent, TimelineState } from '@/engine/types'

/** What actually lands in IndexedDB / Postgres. The event log is stored beside the snapshot. */
export interface StoredTimeline {
  id: string
  ownerId: string | null
  schemaVersion: number
  day: number
  /** `TimelineState` with `eventLog` stripped — the log lives in `events`. */
  snapshot: Omit<TimelineState, 'eventLog'>
  events: GameEvent[]
  updatedAt: string
  createdAt: string
}

export function toStored(state: TimelineState): StoredTimeline {
  const { eventLog, ...snapshot } = state
  return {
    id: state.id,
    ownerId: state.ownerId,
    schemaVersion: state.schemaVersion,
    day: state.day,
    snapshot,
    events: [...eventLog],
    updatedAt: new Date().toISOString(),
    createdAt: state.createdAt,
  }
}

export function fromStored(stored: StoredTimeline): TimelineState {
  return { ...(stored.snapshot as Omit<TimelineState, 'eventLog'>), eventLog: stored.events }
}

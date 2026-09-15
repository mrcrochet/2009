import type { GameEvent, InvestigationState } from '@/engine/types'

/** What actually lands in IndexedDB / Postgres. The event log is stored beside the snapshot. */
export interface StoredInvestigation {
  id: string
  ownerId: string | null
  schemaVersion: number
  caseId: string
  /** `InvestigationState` with `eventLog` stripped — the log lives in `events`. */
  snapshot: Omit<InvestigationState, 'eventLog'>
  events: GameEvent[]
  updatedAt: string
  createdAt: string
}

export function toStored(state: InvestigationState): StoredInvestigation {
  const { eventLog, ...snapshot } = state
  return {
    id: state.id,
    ownerId: state.ownerId,
    schemaVersion: state.schemaVersion,
    caseId: state.caseId,
    snapshot,
    events: [...eventLog],
    updatedAt: new Date().toISOString(),
    createdAt: state.createdAt,
  }
}

export function fromStored(stored: StoredInvestigation): InvestigationState {
  return { ...(stored.snapshot as Omit<InvestigationState, 'eventLog'>), eventLog: stored.events }
}

'use client'

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { CaseContent } from '@/engine/case-schema'
import { isMeaningful, stamp, supersedesPrevious, type EventInput } from '@/engine/events'
import { createInvestigation } from '@/engine/initial-state'
import { applyEvents, reduce } from '@/engine/reducer'
import type { GameEvent, InvestigationState, Viewport } from '@/engine/types'

export interface GameStore {
  investigation: InvestigationState
  content: CaseContent
  viewport: Viewport
  /** Set once the local save has been written at least once. */
  persisted: boolean
  saveError: string | null

  dispatch(input: EventInput): void
  dispatchMany(inputs: readonly EventInput[]): void
  hydrate(state: InvestigationState): void
  setViewport(viewport: Viewport): void
  setSaveError(message: string | null): void
  markPersisted(): void
  replay(): InvestigationState
}

export interface CreateStoreOptions {
  readonly content: CaseContent
  readonly investigation?: InvestigationState
  readonly investigationId?: string
  readonly onEvent?: (
    event: GameEvent,
    next: InvestigationState,
    prev: InvestigationState,
  ) => void
}

export function createGameStore(options: CreateStoreOptions) {
  const initial =
    options.investigation ??
    createInvestigation(options.content, {
      id: options.investigationId ?? crypto.randomUUID(),
      now: new Date().toISOString(),
    })

  return create<GameStore>()((set, get) => ({
    investigation: initial,
    content: options.content,
    viewport: { width: 1280, height: 800 },
    persisted: false,
    saveError: null,

    dispatch(input) {
      const { investigation, content } = get()
      const event = stamp(investigation, input)
      const next = reduce(investigation, event, content)
      if (next === investigation) return
      let withLog = next
      if (isMeaningful(event)) {
        const log = next.eventLog
        const eventLog = supersedesPrevious(event, log[log.length - 1])
          ? [...log.slice(0, -1), event]
          : [...log, event]
        withLog = { ...next, eventLog, updatedAt: new Date().toISOString() }
      }
      set({ investigation: withLog })
      options.onEvent?.(event, withLog, investigation)
    },

    dispatchMany(inputs) {
      for (const input of inputs) get().dispatch(input)
    },

    hydrate(state) {
      set({ investigation: state })
    },

    setViewport(viewport) {
      set({ viewport })
    },

    setSaveError(message) {
      set({ saveError: message })
    },

    markPersisted() {
      set({ persisted: true })
    },

    /** Rebuild state from the log — used by the dev debug panel and by the replay test. */
    replay() {
      const { investigation, content } = get()
      const base = createInvestigation(content, {
        id: investigation.id,
        ownerId: investigation.ownerId,
        now: investigation.createdAt,
        services: investigation.services,
      })
      return applyEvents(base, investigation.eventLog, content)
    },
  }))
}

export type GameStoreApi = ReturnType<typeof createGameStore>

export { useShallow }

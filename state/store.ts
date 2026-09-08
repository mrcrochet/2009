'use client'

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { DayContent } from '@/engine/content-schema'
import { isMeaningful, stamp, supersedesPrevious, type EventInput } from '@/engine/events'
import { createTimeline } from '@/engine/initial-state'
import { applyEvents, reduce } from '@/engine/reducer'
import type { GameEvent, TimelineState, Viewport } from '@/engine/types'

export interface GameStore {
  timeline: TimelineState
  content: DayContent
  viewport: Viewport
  /** Set once the local save has been written at least once. */
  persisted: boolean
  saveError: string | null

  dispatch(input: EventInput): void
  dispatchMany(inputs: readonly EventInput[]): void
  hydrate(state: TimelineState): void
  setViewport(viewport: Viewport): void
  setSaveError(message: string | null): void
  markPersisted(): void
  replay(): TimelineState
}

export interface CreateStoreOptions {
  readonly content: DayContent
  readonly timeline?: TimelineState
  readonly timelineId?: string
  readonly onEvent?: (event: GameEvent, next: TimelineState, prev: TimelineState) => void
}

export function createGameStore(options: CreateStoreOptions) {
  const initial =
    options.timeline ??
    createTimeline(options.content, {
      id: options.timelineId ?? crypto.randomUUID(),
      now: new Date().toISOString(),
    })

  return create<GameStore>()((set, get) => ({
    timeline: initial,
    content: options.content,
    viewport: { width: 1280, height: 800 },
    persisted: false,
    saveError: null,

    dispatch(input) {
      const { timeline, content } = get()
      const event = stamp(timeline, input)
      const next = reduce(timeline, event, content)
      if (next === timeline) return
      let withLog = next
      if (isMeaningful(event)) {
        const log = next.eventLog
        const eventLog = supersedesPrevious(event, log[log.length - 1])
          ? [...log.slice(0, -1), event]
          : [...log, event]
        withLog = { ...next, eventLog, updatedAt: new Date().toISOString() }
      }
      set({ timeline: withLog })
      options.onEvent?.(event, withLog, timeline)
    },

    dispatchMany(inputs) {
      for (const input of inputs) get().dispatch(input)
    },

    hydrate(state) {
      set({ timeline: state })
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
      const { timeline, content } = get()
      const base = createTimeline(content, {
        id: timeline.id,
        ownerId: timeline.ownerId,
        now: timeline.createdAt,
      })
      return applyEvents(base, timeline.eventLog, content)
    },
  }))
}

export type GameStoreApi = ReturnType<typeof createGameStore>

export { useShallow }

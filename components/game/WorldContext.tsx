'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { WorldIndex } from '@/engine/world'
import { useGameApi } from './GameContext'

/**
 * The world graph, and which of it this timeline has actually met.
 *
 * Deliberately separate from `GameContext`. The index is authored content built once and never
 * changing; `discovered` is timeline state. Keeping them in one value here means the surfaces
 * that browse the world — search, the directory — never reach into the store, and so cannot be
 * the thing that re-renders the desktop on an unrelated event.
 */
export interface WorldValue {
  readonly index: WorldIndex
  /** Artifact ids the player has encountered. Everything else exists but is not theirs yet. */
  readonly discovered: ReadonlySet<string>
}

const WorldContext = createContext<WorldValue | null>(null)

export const WorldProvider = WorldContext.Provider

export function useWorld(): WorldValue {
  const value = useContext(WorldContext)
  if (!value) throw new Error('useWorld must be used inside <WorldProvider>')
  return value
}

/** For surfaces that should simply not appear before a world has been supplied. */
export function useWorldOptional(): WorldValue | null {
  return useContext(WorldContext)
}

/**
 * Supplies the world to everything below it, and re-supplies it when the player finds something.
 *
 * It subscribes to one field. `discovered` changes a few dozen times a day, and it is passed
 * `children` as an element built by a parent that does not re-render — so React reuses that
 * subtree and only the components actually reading this context re-render. Reading `discovered`
 * through the store instead would put the whole desktop behind every opened envelope.
 */
export function WorldGate({ index, children }: { index: WorldIndex; children: ReactNode }) {
  const api = useGameApi()
  const read = useCallback(() => api.getState().timeline.discovered, [api])
  const discovered = useSyncExternalStore(api.subscribe, read, read)
  const value = useMemo<WorldValue>(
    () => ({ index, discovered: new Set(discovered) }),
    [index, discovered],
  )
  return <WorldProvider value={value}>{children}</WorldProvider>
}

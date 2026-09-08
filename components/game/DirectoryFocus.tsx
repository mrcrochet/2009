'use client'

import { createContext, useContext } from 'react'

/**
 * Which person the Directory should be showing, when something outside it decided.
 *
 * Separate from both the store and the world: it is a cursor, not game state and not content. A
 * cursor in the event log is noise every replay has to carry forever, and a cursor in the world
 * index would make the world mutable.
 */
const DirectoryFocusContext = createContext<string | null>(null)

export const DirectoryFocusProvider = DirectoryFocusContext.Provider

export function useDirectoryFocus(): string | null {
  return useContext(DirectoryFocusContext)
}

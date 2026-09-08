'use client'

import { useCallback, useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * The CSS block in tokens.css only reaches CSS animations. The boot ticker, the typing pause, the
 * resale settle and the surveillance hold are JavaScript timers, and a player who asked for less
 * motion should not be made to sit through them either. The beats still happen — the waiting does not.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    useCallback(
      () => (typeof window === 'undefined' ? false : window.matchMedia(QUERY).matches),
      [],
    ),
    () => false,
  )
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(QUERY).matches
  } catch {
    return false
  }
}

/** Collapses a scripted delay when the player has asked for less motion. */
export function pace(ms: number, reduced: boolean): number {
  if (!reduced) return ms
  return Math.min(ms, 60)
}

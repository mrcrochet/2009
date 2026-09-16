'use client'

import { useCallback, type KeyboardEvent } from 'react'
import type { QuickLookRef } from '@/engine/types'
import { useDispatch } from './GameContext'

/**
 * Space, on whatever the player has their hands on.
 *
 * It is a keyboard handler rather than a second button because that is what Quick Look *is*: a
 * way to read a document without opening the application that owns it. A button labelled
 * "preview" next to every file would be the same feature stated as furniture.
 *
 * `preventDefault` matters here — Space on a focused `<button>` is a click, so without it the
 * key would both hold the document up and open it underneath.
 */
export function useQuickLookKey(): (ref: QuickLookRef) => (event: KeyboardEvent) => void {
  const dispatch = useDispatch()
  return useCallback(
    (ref: QuickLookRef) => (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Spacebar') return
      event.preventDefault()
      event.stopPropagation()
      dispatch({ type: 'QUICK_LOOK_OPENED', ref })
    },
    [dispatch],
  )
}

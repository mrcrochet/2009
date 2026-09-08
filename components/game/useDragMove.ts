'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

interface Options {
  /** Position the element is currently laid out at. */
  origin: () => { x: number; y: number }
  /** Called once, on release, with the final position. */
  onCommit: (x: number, y: number) => void
  /** Drag is suppressed entirely on the mobile layout, where windows are full-bleed. */
  disabled?: boolean
}

/**
 * Pointer-Events drag that never writes to the store mid-gesture. The moving element gets a
 * `translate3d` transform written straight to its style, so dragging one window does not
 * rerender the desktop, the dock or any other window.
 */
export function useDragMove(ref: RefObject<HTMLElement | null>, { origin, onCommit, disabled }: Options) {
  const drag = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  const finish = useCallback(() => {
    const node = ref.current
    const d = drag.current
    drag.current = null
    if (!node || !d) return
    const transform = node.style.transform
    node.style.transform = ''
    const match = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(transform)
    if (!match) return
    const dx = Number(match[1])
    const dy = Number(match[2])
    if (dx === 0 && dy === 0) return
    onCommit(d.baseX + dx, d.baseY + dy)
  }, [onCommit, ref])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled) return
      if (event.button !== 0) return
      const target = event.target as HTMLElement
      // Never start a drag from a control inside the titlebar.
      if (target.closest('button, input, textarea, a, select')) return
      const node = ref.current
      if (!node) return
      const base = origin()
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: base.x,
        baseY: base.y,
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* capture is a nicety */
      }
      event.preventDefault()
    },
    [disabled, origin, ref],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current
      const node = ref.current
      if (!d || !node || event.pointerId !== d.pointerId) return
      const dx = event.clientX - d.startX
      const dy = event.clientY - d.startY
      node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
    },
    [ref],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d || event.pointerId !== d.pointerId) return
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
      finish()
    },
    [finish],
  )

  // If the pointer is lost (window blur, tab switch), still commit where it was.
  useEffect(() => () => finish(), [finish])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
}

const COMPACT_QUERY = '(max-width: 860px)'

function subscribeCompact(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(COMPACT_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** True on the narrow layout, where the window manager collapses to one foregrounded app. */
export function useIsCompact(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => (typeof window === 'undefined' ? false : window.matchMedia(COMPACT_QUERY).matches),
    () => false,
  )
}

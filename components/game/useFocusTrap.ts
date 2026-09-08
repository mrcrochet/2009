'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Makes `aria-modal` true rather than merely asserted: focus moves in on open, Tab cannot leave,
 * the rest of the desktop is inert, and focus returns to whatever opened it on close.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const opener = document.activeElement as HTMLElement | null

    // Everything outside the trap stops being reachable — by Tab or by pointer.
    const outside: HTMLElement[] = []
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue
      if (child.contains(node)) continue
      outside.push(child)
    }
    const inertBefore = outside.map((el) => el.hasAttribute('inert'))
    for (const el of outside) el.setAttribute('inert', '')

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusables()[0]
    ;(first ?? node).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const head = items[0] as HTMLElement
      const tail = items[items.length - 1] as HTMLElement
      const current = document.activeElement
      if (event.shiftKey && (current === head || current === node)) {
        event.preventDefault()
        tail.focus()
      } else if (!event.shiftKey && current === tail) {
        event.preventDefault()
        head.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      outside.forEach((el, i) => {
        if (!inertBefore[i]) el.removeAttribute('inert')
      })
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [ref, active])
}

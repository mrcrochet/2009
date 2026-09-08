'use client'

import { useCallback, type KeyboardEvent } from 'react'

/**
 * A real tab widget: roving tabindex, arrow keys, Home/End, and the id wiring that lets a screen
 * reader connect a tab to the panel it controls. Used by Ember Messenger and the phone, which
 * both looked like tabs but behaved like a row of buttons.
 */
export function useTabList<T extends string>(
  ids: readonly T[],
  active: T,
  onSelect: (id: T) => void,
  namespace: string,
) {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const index = ids.indexOf(active)
      if (index === -1) return
      let next: number | null = null
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % ids.length
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + ids.length) % ids.length
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = ids.length - 1
      if (next === null) return
      event.preventDefault()
      const id = ids[next]
      if (!id) return
      onSelect(id)
      document.getElementById(`${namespace}-tab-${id}`)?.focus()
    },
    [ids, active, onSelect, namespace],
  )

  return {
    tabProps: (id: T) => ({
      id: `${namespace}-tab-${id}`,
      role: 'tab' as const,
      'aria-selected': active === id,
      'aria-controls': `${namespace}-panel-${id}`,
      tabIndex: active === id ? 0 : -1,
      onKeyDown,
    }),
    panelProps: {
      id: `${namespace}-panel-${active}`,
      role: 'tabpanel' as const,
      'aria-labelledby': `${namespace}-tab-${active}`,
      tabIndex: -1,
    },
  }
}

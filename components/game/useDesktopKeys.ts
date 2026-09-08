'use client'

import { useEffect } from 'react'
import type { GameStoreApi } from '@/state/store'

/**
 * Keyboard routes through HALCYON. With nine windows open the dock sits about a hundred Tab
 * presses away, so a keyboard player needs the same shortcuts a 2009 machine gave everyone else.
 */
export function useDesktopKeys(api: GameStoreApi): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()

      // Ctrl+` — cycle to the window behind the front one, the way ⌘` always did.
      if (event.key === '`') {
        const { timeline, dispatch } = api.getState()
        const open = timeline.windows.filter((w) => !w.minimized)
        if (open.length < 2) return
        event.preventDefault()
        const front = open.reduce((a, b) => (b.z > a.z ? b : a))
        const behind = open.filter((w) => w.app !== front.app).reduce((a, b) => (b.z > a.z ? b : a))
        dispatch({ type: 'APP_FOCUSED', app: behind.app })
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`.hal-window[data-app="${behind.app}"]`)?.focus()
        })
        return
      }

      // Ctrl+D — the dock.
      if (key === 'd') {
        const dock = document.querySelector<HTMLElement>('.hal-dockitem')
        if (!dock) return
        event.preventDefault()
        dock.focus()
        return
      }

      // Ctrl+E — the evidence tray.
      if (key === 'e') {
        const { timeline, dispatch } = api.getState()
        event.preventDefault()
        if (!timeline.ui.trayOpen) dispatch({ type: 'TRAY_TOGGLED', open: true })
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>('.hal-tray__board')?.focus()
        })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api])
}

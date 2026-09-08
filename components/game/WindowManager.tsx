'use client'

import { Suspense, lazy, useMemo, type ComponentType, type ReactElement } from 'react'
import type { AppId } from '@/engine/types'
import { useContent, useTimeline } from './GameContext'
import { WindowFrame } from './WindowFrame'

/** Heavy apps are code-split so the desktop paints before any of them load. */
const load = {
  mail: () => import('./apps/MailApp'),
  msg: () => import('./apps/MessengerApp'),
  web: () => import('./apps/BrowserApp'),
  files: () => import('./apps/FilesApp'),
  bank: () => import('./apps/BankApp'),
  mkt: () => import('./apps/QuotelineApp'),
  notes: () => import('./apps/NotesApp'),
  term: () => import('./apps/TerminalApp'),
  recall: () => import('./apps/RecallApp'),
} satisfies Record<AppId, () => Promise<unknown>>

const REGISTRY: Record<AppId, ComponentType> = {
  mail: lazy(() => load.mail().then((m) => ({ default: m.MailApp }))),
  msg: lazy(() => load.msg().then((m) => ({ default: m.MessengerApp }))),
  web: lazy(() => load.web().then((m) => ({ default: m.BrowserApp }))),
  files: lazy(() => load.files().then((m) => ({ default: m.FilesApp }))),
  bank: lazy(() => load.bank().then((m) => ({ default: m.BankApp }))),
  mkt: lazy(() => load.mkt().then((m) => ({ default: m.QuotelineApp }))),
  notes: lazy(() => load.notes().then((m) => ({ default: m.NotesApp }))),
  term: lazy(() => load.term().then((m) => ({ default: m.TerminalApp }))),
  recall: lazy(() => load.recall().then((m) => ({ default: m.RecallApp }))),
}

/**
 * Each app's element is created once and reused, so the memoised `WindowFrame` can actually bail
 * out. Recreating `<App />` inside the map would hand every window new children on every render
 * and defeat the memo entirely.
 */
const APP_ELEMENTS: Partial<Record<AppId, ReactElement>> = {}

function appElement(app: AppId): ReactElement {
  const cached = APP_ELEMENTS[app]
  if (cached) return cached
  const App = REGISTRY[app]
  const element = (
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  )
  APP_ELEMENTS[app] = element
  return element
}

/**
 * Warmed during the boot sequence. Ember Messenger opens itself 1100 ms after the desktop
 * appears — the most dramatic moment of the opening — and it should not arrive as "loading…".
 */
export function prefetchApp(app: AppId): void {
  void load[app]().catch(() => {
    /* a failed prefetch just means the lazy import runs normally */
  })
}

export function WindowManager() {
  const content = useContent()
  const windows = useTimeline((s) => s.windows)

  const topZ = useMemo(
    () => windows.filter((w) => !w.minimized).reduce((max, w) => Math.max(max, w.z), -1),
    [windows],
  )

  return (
    <>
      {windows.map((win) => {
        const def = content.apps.find((a) => a.id === win.app)
        if (!def) return null
        return (
          <WindowFrame key={win.app} def={def} win={win} front={win.z === topZ}>
            {appElement(win.app)}
          </WindowFrame>
        )
      })}
    </>
  )
}

function AppLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-terminal)',
        fontSize: 11,
        letterSpacing: '0.1em',
        color: '#8b8b84',
        background: 'var(--win-bg)',
      }}
    >
      loading…
    </div>
  )
}

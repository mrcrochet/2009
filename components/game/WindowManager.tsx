'use client'

import { Suspense, lazy, useMemo } from 'react'
import type { AppId } from '@/engine/types'
import { useContent, useTimeline } from './GameContext'
import { WindowFrame } from './WindowFrame'

/** Heavy apps are code-split so the desktop paints before any of them load. */
const MailApp = lazy(() => import('./apps/MailApp').then((m) => ({ default: m.MailApp })))
const MessengerApp = lazy(() => import('./apps/MessengerApp').then((m) => ({ default: m.MessengerApp })))
const BrowserApp = lazy(() => import('./apps/BrowserApp').then((m) => ({ default: m.BrowserApp })))
const FilesApp = lazy(() => import('./apps/FilesApp').then((m) => ({ default: m.FilesApp })))
const BankApp = lazy(() => import('./apps/BankApp').then((m) => ({ default: m.BankApp })))
const QuotelineApp = lazy(() => import('./apps/QuotelineApp').then((m) => ({ default: m.QuotelineApp })))
const NotesApp = lazy(() => import('./apps/NotesApp').then((m) => ({ default: m.NotesApp })))
const TerminalApp = lazy(() => import('./apps/TerminalApp').then((m) => ({ default: m.TerminalApp })))
const RecallApp = lazy(() => import('./apps/RecallApp').then((m) => ({ default: m.RecallApp })))

const REGISTRY: Record<AppId, React.ComponentType> = {
  mail: MailApp,
  msg: MessengerApp,
  web: BrowserApp,
  files: FilesApp,
  bank: BankApp,
  mkt: QuotelineApp,
  notes: NotesApp,
  term: TerminalApp,
  recall: RecallApp,
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
        const App = REGISTRY[win.app]
        return (
          <WindowFrame key={win.app} def={def} win={win} front={win.z === topZ}>
            <Suspense fallback={<AppLoading />}>
              <App />
            </Suspense>
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

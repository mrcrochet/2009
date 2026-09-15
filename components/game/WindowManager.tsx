'use client'

import { Suspense, lazy, useMemo, type ComponentType, type ReactElement } from 'react'
import type { AppId } from '@/engine/types'
import { useContent, useInvestigation } from './GameContext'
import { WindowFrame } from './WindowFrame'

/**
 * Heavy apps are code-split so the desktop paints before any of them load.
 *
 * The registry is the build's, and the *roster* is the case's: a case declares which of these it
 * ships and what each is called. An app id a case names and this build does not know renders as
 * a window that says so, rather than as a crash — a case is content, and content arriving from
 * ahead of the code is a thing that will happen.
 */
const load: Record<string, () => Promise<Record<string, ComponentType>>> = {
  mail: () => import('./apps/MailApp'),
  msg: () => import('./apps/MessengerApp'),
  web: () => import('./apps/BrowserApp'),
  files: () => import('./apps/FilesApp'),
  devices: () => import('./apps/DevicesApp'),
  notes: () => import('./apps/NotesApp'),
  term: () => import('./apps/TerminalApp'),
  directory: () => import('./apps/DirectoryApp'),
}

const REGISTRY: Record<string, ComponentType> = {
  mail: lazy(() => load.mail!().then((m) => ({ default: m.MailApp! }))),
  msg: lazy(() => load.msg!().then((m) => ({ default: m.MessengerApp! }))),
  web: lazy(() => load.web!().then((m) => ({ default: m.BrowserApp! }))),
  files: lazy(() => load.files!().then((m) => ({ default: m.FilesApp! }))),
  devices: lazy(() => load.devices!().then((m) => ({ default: m.DevicesApp! }))),
  notes: lazy(() => load.notes!().then((m) => ({ default: m.NotesApp! }))),
  term: lazy(() => load.term!().then((m) => ({ default: m.TerminalApp! }))),
  directory: lazy(() => load.directory!().then((m) => ({ default: m.DirectoryApp! }))),
}

function MissingApp() {
  return <div className="hal-apploading">This workstation does not have that application.</div>
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
  const App = REGISTRY[app] ?? MissingApp
  const element = (
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  )
  APP_ELEMENTS[app] = element
  return element
}

/**
 * Warmed during the boot sequence. The messenger opens itself shortly after the desktop
 * appears — the most dramatic moment of the opening — and it should not arrive as "loading…".
 */
export function prefetchApp(app: AppId): void {
  void load[app]?.().catch(() => {
    /* a failed prefetch just means the lazy import runs normally */
  })
}

export function WindowManager() {
  const content = useContent()
  const windows = useInvestigation((s) => s.windows)

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

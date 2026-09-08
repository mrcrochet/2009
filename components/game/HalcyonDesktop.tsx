'use client'

import { useEffect, useState } from 'react'
import { Dock } from './Dock'
import { SearchPalette } from './SearchPalette'
import { DayEndCard } from './DayEndCard'
import { DebugPanel } from './DebugPanel'
import { DesktopIcons } from './DesktopIcons'
import { EvidenceTray } from './EvidenceTray'
import { InvestigationBoard } from './InvestigationBoard'
import { MenuBar } from './MenuBar'
import { PhoneOverlay } from './PhoneOverlay'
import { SurveillanceOverlay } from './SurveillanceOverlay'
import { WayUpOverlay } from './WayUpOverlay'
import { WindowManager } from './WindowManager'
import { useDispatch, useTimeline } from './GameContext'
import { useWorldOptional } from './WorldContext'
import { DirectoryFocusProvider } from './DirectoryFocus'
import { artifactUrl } from '@/engine/world'
import type { SearchHit } from '@/engine/world'
import type { AppId } from '@/engine/types'

/** Which application shows a given surface. The phone is not one — it is an overlay. */
const SURFACE_APP: Record<string, AppId> = {
  mail: 'mail',
  msg: 'msg',
  web: 'web',
  files: 'files',
  bank: 'bank',
  term: 'term',
  archive: 'web',
}

export function HalcyonDesktop({ onEndDay }: { onEndDay: () => void }) {
  const dispatch = useDispatch()
  const world = useWorldOptional()
  const [searchOpen, setSearchOpen] = useState(false)
  /**
   * Which person the Directory is showing, when the search sent the player there.
   *
   * React state rather than an event: this is a cursor, like the highlighted row in the search
   * palette, and a cursor in the event log is noise a replay has to carry forever.
   */
  const [directoryFocus, setDirectoryFocus] = useState<string | null>(null)
  const trayOpen = useTimeline((s) => s.ui.trayOpen)
  const boardOpen = useTimeline((s) => s.ui.boardOpen)
  const wayupOpen = useTimeline((s) => s.ui.wayupOpen)
  const phoneOpen = useTimeline((s) => s.phone.open)

  // One search across the whole machine. Ctrl+K rather than a dock icon: it is a route through
  // the system, not an application.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Escape backs out of whatever is on top, innermost first, and never out of the day itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (searchOpen || boardOpen || wayupOpen) return // each handles its own Escape
      if (trayOpen) dispatch({ type: 'TRAY_TOGGLED', open: false })
      else if (phoneOpen) dispatch({ type: 'PHONE_TOGGLED' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, trayOpen, boardOpen, phoneOpen, searchOpen, wayupOpen])

  /**
   * Opening a result has to arrive at the document, not at the application that happens to hold
   * it. A search that puts you in the right window and leaves you to find the thing again is a
   * list of places you have already been.
   */
  const openHit = (hit: SearchHit) => {
    if (hit.kind === 'entity') {
      dispatch({ type: 'APP_OPENED', app: 'directory' })
      setDirectoryFocus(hit.id)
      return
    }

    const artifact = world?.index.artifactById.get(hit.id) ?? null
    // A projected day artifact carries the id of the thing the day authored, which is what the
    // mail and files apps address each other by.
    const local = artifact ? /^d\d+\.(mail|file|photo|sms|txn|web)\.(.+)$/.exec(artifact.id) : null

    if (hit.surface === 'phone') {
      if (!phoneOpen) dispatch({ type: 'PHONE_TOGGLED' })
      dispatch({ type: 'PHONE_TAB_CHANGED', tab: local?.[1] === 'photo' ? 'photos' : 'sms' })
      return
    }

    const app: AppId = SURFACE_APP[hit.surface] ?? 'files'
    dispatch({ type: 'APP_OPENED', app })
    if (!artifact) return

    if (app === 'web') {
      const url = artifactUrl(artifact)
      if (url) dispatch({ type: 'BROWSER_NAVIGATED', url, worldArtifactId: artifact.id })
    } else if (app === 'mail' && local?.[1] === 'mail') {
      dispatch({ type: 'MAIL_OPENED', mailId: local[2]! })
    } else if (app === 'files' && local?.[1] === 'file') {
      dispatch({ type: 'FILE_OPENED', fileId: local[2]! })
    }
  }

  return (
    <div className="hal-desktop" data-testid="desktop">
      <div className="hal-desktop__bg" />
      <div className="hal-desktop__grid" aria-hidden="true" />
      <MenuBar onEndDay={onEndDay} />
      <DesktopIcons />
      <DirectoryFocusProvider value={directoryFocus}>
        <WindowManager />
      </DirectoryFocusProvider>
      <PhoneOverlay />
      <EvidenceTray />
      <InvestigationBoard />
      <WayUpOverlay />
      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenHit={(hit) => {
          setSearchOpen(false)
          openHit(hit)
        }}
      />
      <Dock />
      <SurveillanceOverlay />
      <DayEndCard />
      <DebugPanel />
    </div>
  )
}

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
import { WindowManager } from './WindowManager'
import { useDispatch, useTimeline } from './GameContext'
import type { AppId } from '@/engine/types'

/** Which application shows a given surface. */
const SURFACE_APP: Record<string, AppId> = {
  mail: 'mail',
  msg: 'msg',
  web: 'web',
  files: 'files',
  bank: 'bank',
  phone: 'files',
  term: 'term',
  archive: 'web',
}

export function HalcyonDesktop({ onEndDay }: { onEndDay: () => void }) {
  const dispatch = useDispatch()
  const [searchOpen, setSearchOpen] = useState(false)
  const trayOpen = useTimeline((s) => s.ui.trayOpen)
  const boardOpen = useTimeline((s) => s.ui.boardOpen)
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
      if (searchOpen || boardOpen) return // each handles its own Escape
      if (trayOpen) dispatch({ type: 'TRAY_TOGGLED', open: false })
      else if (phoneOpen) dispatch({ type: 'PHONE_TOGGLED' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, trayOpen, boardOpen, phoneOpen, searchOpen])

  return (
    <div className="hal-desktop" data-testid="desktop">
      <div className="hal-desktop__bg" />
      <div className="hal-desktop__grid" aria-hidden="true" />
      <MenuBar onEndDay={onEndDay} />
      <DesktopIcons />
      <WindowManager />
      <PhoneOverlay />
      <EvidenceTray />
      <InvestigationBoard />
      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenHit={(hit) => {
          setSearchOpen(false)
          // A person opens the Directory; anything else opens the surface it lives on.
          const app: AppId =
            hit.surface === 'people' ? 'directory' : (SURFACE_APP[hit.surface] ?? 'files')
          dispatch({ type: 'APP_OPENED', app })
        }}
      />
      <Dock />
      <SurveillanceOverlay />
      <DayEndCard />
      <DebugPanel />
    </div>
  )
}

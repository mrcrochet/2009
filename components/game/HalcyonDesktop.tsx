'use client'

import { useEffect } from 'react'
import { Dock } from './Dock'
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

export function HalcyonDesktop({ onEndDay }: { onEndDay: () => void }) {
  const dispatch = useDispatch()
  const trayOpen = useTimeline((s) => s.ui.trayOpen)
  const boardOpen = useTimeline((s) => s.ui.boardOpen)
  const phoneOpen = useTimeline((s) => s.phone.open)

  // Escape backs out of whatever is on top, innermost first, and never out of the day itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (boardOpen) return // the board handles its own Escape
      if (trayOpen) dispatch({ type: 'TRAY_TOGGLED', open: false })
      else if (phoneOpen) dispatch({ type: 'PHONE_TOGGLED' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, trayOpen, boardOpen, phoneOpen])

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
      <Dock />
      <SurveillanceOverlay />
      <DayEndCard />
      <DebugPanel />
    </div>
  )
}

'use client'

import { useContent, useDispatch, useInvestigation } from './GameContext'
import { SoundControl } from './SoundControl'
import {
  selectCanFileReport,
  selectFrontTitle,
  selectMenuBarClock,
  selectOutstandingBeats,
} from '@/engine/selectors'

/**
 * Not a `menubar` widget: File / Edit / View are period scenery with no menus behind them, and
 * claiming the role would promise arrow-key navigation into menus that do not exist. It is a
 * labelled group of real buttons.
 */
export function MenuBar({ onFileReport }: { onFileReport: () => void }) {
  const content = useContent()
  const dispatch = useDispatch()
  const frontTitle = useInvestigation((s) => selectFrontTitle(s, content))
  const clock = useInvestigation((s) => selectMenuBarClock(s, content))
  const canFile = useInvestigation((s) => selectCanFileReport(s, content))
  const outstanding = useInvestigation((s) => selectOutstandingBeats(s, content))
  const trayOpen = useInvestigation((s) => s.ui.trayOpen)
  const caseNumber = String(content.number).padStart(3, '0')

  return (
    <div className="nova-menubar" role="group" aria-label={`${content.osName} menu bar`}>
      <span className="nova-menubar__brand">
        <span className="nova-menubar__mark" aria-hidden="true" />
        {content.osName.split(' ')[0]}
      </span>
      <span className="nova-menubar__front">{frontTitle}</span>
      <span className="nova-menubar__menu" aria-hidden="true">
        File
      </span>
      <span className="nova-menubar__menu" aria-hidden="true">
        Edit
      </span>
      <span className="nova-menubar__menu" aria-hidden="true">
        View
      </span>
      <span className="nova-menubar__spacer" />
      <SoundControl />
      {canFile ? (
        <button type="button" className="nova-menubar__action" onClick={onFileReport}>
          File the report
        </button>
      ) : (
        <button
          type="button"
          className="nova-menubar__action nova-menubar__action--pending"
          aria-label={`Case ${caseNumber} — ${outstanding.length} things left: ${outstanding
            .map((b) => content.beatHints[b] ?? b)
            .join(', ')}. Show the evidence tray.`}
          onClick={() => dispatch({ type: 'TRAY_TOGGLED', open: !trayOpen })}
        >
          Case {caseNumber} · {outstanding.length} left
        </button>
      )}
      <span className="nova-menubar__clock">{clock}</span>
    </div>
  )
}

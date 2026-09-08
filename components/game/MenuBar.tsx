'use client'

import { useContent, useDispatch, useTimeline } from './GameContext'
import { selectCanEndDay, selectFrontTitle, selectMenuBarClock, selectOutstandingBeats } from '@/engine/selectors'

const BEAT_HINT: Record<string, string> = {
  readme: 'read the file on the desktop',
  marc: 'answer Marc',
  recall: 'use Recall once',
  money: 'turn the $437.82 into more',
  claim: 'put a claim on the record',
}

export function MenuBar({ onEndDay }: { onEndDay: () => void }) {
  const content = useContent()
  const dispatch = useDispatch()
  const frontTitle = useTimeline((s) => selectFrontTitle(s, content))
  const clock = useTimeline((s) => selectMenuBarClock(s))
  const canEnd = useTimeline((s) => selectCanEndDay(s, content))
  const outstanding = useTimeline((s) => selectOutstandingBeats(s, content))
  const trayOpen = useTimeline((s) => s.ui.trayOpen)

  return (
    <div className="hal-menubar" role="menubar" aria-label={`${content.osName} menu bar`}>
      <span className="hal-menubar__brand">
        <span className="hal-menubar__mark" aria-hidden="true" />
        HALCYON
      </span>
      <span className="hal-menubar__front">{frontTitle}</span>
      <button type="button" className="hal-menubar__menu" role="menuitem" tabIndex={-1}>
        File
      </button>
      <button type="button" className="hal-menubar__menu" role="menuitem" tabIndex={-1}>
        Edit
      </button>
      <button type="button" className="hal-menubar__menu" role="menuitem" tabIndex={-1}>
        View
      </button>
      <span className="hal-menubar__spacer" />
      {canEnd ? (
        <button type="button" className="hal-menubar__action" onClick={onEndDay}>
          End day {String(content.day).padStart(2, '0')}
        </button>
      ) : (
        <button
          type="button"
          className="hal-menubar__action"
          style={{ opacity: 0.45, cursor: 'default' }}
          aria-disabled="true"
          title={`Still to do: ${outstanding.map((b) => BEAT_HINT[b] ?? b).join(', ')}`}
          onClick={() => dispatch({ type: 'TRAY_TOGGLED', open: !trayOpen })}
        >
          Day {String(content.day).padStart(2, '0')} · {outstanding.length} left
        </button>
      )}
      <span className="hal-menubar__clock">{clock}</span>
    </div>
  )
}

'use client'

import { selectEvidenceCards } from '@/engine/selectors'
import { useContent, useDispatch, useTimeline } from './GameContext'
import { KeptLines } from './KeptLines'

/** Light, collapsible, always reachable. Never a permanent panel. */
export function EvidenceTray() {
  const content = useContent()
  const dispatch = useDispatch()
  const open = useTimeline((s) => s.ui.trayOpen)
  const cards = useTimeline((s) => selectEvidenceCards(s, content))
  const day = useTimeline((s) => s.day)

  return (
    <>
      <button
        type="button"
        className="hal-traytab"
        data-testid="evidence-tab"
        aria-expanded={open}
        aria-controls="evidence-tray"
        onClick={() => dispatch({ type: 'TRAY_TOGGLED' })}
      >
        EVIDENCE {cards.length > 0 ? `· ${cards.length}` : ''}
      </button>

      {open ? (
        <aside className="hal-tray" id="evidence-tray" aria-label="Pinned evidence">
          <div className="hal-tray__head">
            <span className="hal-tray__title">PINNED EVIDENCE</span>
            <button
              type="button"
              className="hal-tray__close"
              aria-label="Close evidence tray"
              onClick={() => dispatch({ type: 'TRAY_TOGGLED', open: false })}
            >
              ×
            </button>
          </div>
          <div className="hal-tray__list">
            {cards.map((e) => (
              <div key={e.id} className="hal-evcard">
                <div className="hal-evcard__src">
                  {e.source}
                  {e.day !== day ? (
                    <span className="hal-evcard__day"> · DAY {String(e.day).padStart(2, '0')}</span>
                  ) : null}
                </div>
                <div className="hal-evcard__text">{e.text}</div>
                <div className="hal-evcard__tags">{e.reliability.toUpperCase()}</div>
              </div>
            ))}
            {cards.length === 0 ? (
              <div className="hal-tray__empty">
                Nothing pinned.
                <br />
                <br />
                Anything with a timestamp, a name or an amount can be kept. The machine will not
                decide what matters.
              </div>
            ) : null}
            <KeptLines variant="tray" />
          </div>
          <div className="hal-tray__foot">
            <button
              type="button"
              className="hal-tray__board"
              onClick={() => dispatch({ type: 'BOARD_TOGGLED', open: true })}
            >
              OPEN BOARD
            </button>
          </div>
        </aside>
      ) : null}
    </>
  )
}

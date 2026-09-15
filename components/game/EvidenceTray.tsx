'use client'

import { selectEvidenceCards } from '@/engine/selectors'
import { useContent, useDispatch, useInvestigation } from './GameContext'
import { KeptLines } from './KeptLines'

/** Light, collapsible, always reachable. Never a permanent panel. */
export function EvidenceTray() {
  const content = useContent()
  const dispatch = useDispatch()
  const open = useInvestigation((s) => s.ui.trayOpen)
  const cards = useInvestigation((s) => selectEvidenceCards(s, content))

  return (
    <>
      <button
        type="button"
        className="nova-traytab"
        data-testid="evidence-tab"
        aria-expanded={open}
        aria-controls="evidence-tray"
        onClick={() => dispatch({ type: 'TRAY_TOGGLED' })}
      >
        EVIDENCE {cards.length > 0 ? `· ${cards.length}` : ''}
      </button>

      {open ? (
        <aside className="nova-tray" id="evidence-tray" aria-label="Pinned evidence">
          <div className="nova-tray__head">
            <span className="nova-tray__title">PINNED EVIDENCE</span>
            <button
              type="button"
              className="nova-tray__close"
              aria-label="Close evidence tray"
              onClick={() => dispatch({ type: 'TRAY_TOGGLED', open: false })}
            >
              ×
            </button>
          </div>
          <div className="nova-tray__list">
            {cards.map((e) => (
              <div key={e.id} className="nova-evcard">
                <div className="nova-evcard__src">{e.source}</div>
                <div className="nova-evcard__text">{e.text}</div>
                <div className="nova-evcard__tags">{e.reliability.toUpperCase()}</div>
              </div>
            ))}
            {cards.length === 0 ? (
              <div className="nova-tray__empty">
                Nothing pinned.
                <br />
                <br />
                Anything with a timestamp, a name or an amount can be kept. The machine will not
                decide what matters.
              </div>
            ) : null}
            <KeptLines variant="tray" />
          </div>
          <div className="nova-tray__foot">
            <button
              type="button"
              className="nova-tray__board"
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

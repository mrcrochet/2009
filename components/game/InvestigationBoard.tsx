'use client'

import { useEffect, useRef } from 'react'
import { selectEvidenceCards } from '@/engine/selectors'
import { KeptLines } from './KeptLines'
import { useContent, useDispatch, useInvestigation } from './GameContext'
import { useFocusTrap } from './useFocusTrap'

const VERDICT_LABEL = {
  accepted: 'ACCEPTED',
  insufficient: 'INSUFFICIENT',
  refused: 'REFUSED — FILED UNDER YOUR NAME',
} as const

/**
 * A focused in-world mode, not a modal form. The player picks exactly what they are relying on
 * and puts an assertion on the record; the record is permanent, including when it is wrong.
 */
export function InvestigationBoard() {
  const content = useContent()
  const dispatch = useDispatch()
  const open = useInvestigation((s) => s.ui.boardOpen)
  const cards = useInvestigation((s) => selectEvidenceCards(s, content))
  const selectedClaimId = useInvestigation((s) => s.selectedClaimId)
  const selectedEvidence = useInvestigation((s) => s.selectedEvidenceIds)
  const verdict = useInvestigation((s) => s.lastVerdict)
  const log = useInvestigation((s) => s.claimLog)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'BOARD_TOGGLED', open: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dispatch])

  if (!open) return null

  return (
    <div className="nova-board">
      <div
        className="nova-board__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Investigation board"
        tabIndex={-1}
      >
        <div className="nova-board__head">
          <span className="nova-board__title">INVESTIGATION — BUILD A CLAIM</span>
          <button
            type="button"
            className="nova-board__close"
            aria-label="Close the board"
            onClick={() => dispatch({ type: 'BOARD_TOGGLED', open: false })}
          >
            ×
          </button>
        </div>
        <div className="nova-board__cols">
          <div className="nova-board__left">
            <div className="nova-board__label">SELECT THE PIECES YOU ARE RELYING ON</div>
            <div className="nova-board__stack">
              {cards.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="nova-evcard nova-evcard--pick"
                  aria-pressed={e.selected}
                  data-evidence={e.id}
                  onClick={() => dispatch({ type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: e.id })}
                >
                  <span className="nova-evcard__src">{e.source}</span>
                  <span className="nova-evcard__text">{e.text}</span>
                  <span className="nova-evcard__check">{e.selected ? '✓ RELYING ON THIS' : ''}</span>
                </button>
              ))}
              {cards.length === 0 ? (
                <div className="nova-tray__empty">
                  Pin something first. A claim is only as good as what you are prepared to name
                  behind it.
                </div>
              ) : null}
              <KeptLines variant="board" />
            </div>
          </div>
          <div className="nova-board__right">
            <div className="nova-board__label">ASSERT</div>
            {content.claims.map((c) => (
              <button
                key={c.id}
                type="button"
                className="nova-board__claim"
                aria-pressed={selectedClaimId === c.id}
                data-claim={c.id}
                onClick={() => dispatch({ type: 'CLAIM_SELECTED', claimId: c.id })}
              >
                {c.text}
              </button>
            ))}
            <button
              type="button"
              className="nova-board__submit"
              disabled={!selectedClaimId}
              onClick={() =>
                selectedClaimId &&
                dispatch({
                  type: 'CLAIM_ASSERTED',
                  claimId: selectedClaimId,
                  evidenceIds: selectedEvidence,
                })
              }
            >
              SUBMIT CLAIM
            </button>
            {verdict ? (
              <div
                className={`nova-board__verdict${verdict.verdict === 'accepted' ? ' nova-board__verdict--accepted' : ''}`}
                role="status"
                data-verdict={verdict.verdict}
              >
                <span className="nova-board__verdictkind">{VERDICT_LABEL[verdict.verdict]}</span>
                {verdict.message}
              </div>
            ) : null}
            {log.length > 0 ? (
              <div className="nova-board__log">
                <div className="nova-board__loglabel">CLAIMS ON RECORD</div>
                {log.map((entry, i) => (
                  <div key={`${entry.claimId}-${i}`} className="nova-board__logitem">
                    — {entry.claimText}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

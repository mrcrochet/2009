'use client'

import { useEffect } from 'react'
import { selectEvidenceCards } from '@/engine/selectors'
import { useContent, useDispatch, useTimeline } from './GameContext'

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
  const open = useTimeline((s) => s.ui.boardOpen)
  const cards = useTimeline((s) => selectEvidenceCards(s, content))
  const selectedClaimId = useTimeline((s) => s.selectedClaimId)
  const selectedEvidence = useTimeline((s) => s.selectedEvidenceIds)
  const verdict = useTimeline((s) => s.lastVerdict)
  const log = useTimeline((s) => s.claimLog)

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
    <div className="hal-board" role="dialog" aria-modal="true" aria-label="Investigation board">
      <div className="hal-board__panel">
        <div className="hal-board__head">
          <span className="hal-board__title">INVESTIGATION — BUILD A CLAIM</span>
          <button
            type="button"
            className="hal-board__close"
            aria-label="Close the board"
            onClick={() => dispatch({ type: 'BOARD_TOGGLED', open: false })}
          >
            ×
          </button>
        </div>
        <div className="hal-board__cols">
          <div className="hal-board__left">
            <div className="hal-board__label">SELECT THE PIECES YOU ARE RELYING ON</div>
            <div className="hal-board__stack">
              {cards.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="hal-evcard hal-evcard--pick"
                  aria-pressed={e.selected}
                  data-evidence={e.id}
                  onClick={() => dispatch({ type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: e.id })}
                >
                  <span className="hal-evcard__src">{e.source}</span>
                  <span className="hal-evcard__text">{e.text}</span>
                  <span className="hal-evcard__check">{e.selected ? '✓ RELYING ON THIS' : ''}</span>
                </button>
              ))}
              {cards.length === 0 ? (
                <div className="hal-tray__empty">Pin something first.</div>
              ) : null}
            </div>
          </div>
          <div className="hal-board__right">
            <div className="hal-board__label">ASSERT</div>
            {content.claims.map((c) => (
              <button
                key={c.id}
                type="button"
                className="hal-board__claim"
                aria-pressed={selectedClaimId === c.id}
                data-claim={c.id}
                onClick={() => dispatch({ type: 'CLAIM_SELECTED', claimId: c.id })}
              >
                {c.text}
              </button>
            ))}
            <button
              type="button"
              className="hal-board__submit"
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
                className={`hal-board__verdict${verdict.verdict === 'accepted' ? ' hal-board__verdict--accepted' : ''}`}
                role="status"
                data-verdict={verdict.verdict}
              >
                <span className="hal-board__verdictkind">{VERDICT_LABEL[verdict.verdict]}</span>
                {verdict.message}
              </div>
            ) : null}
            {log.length > 0 ? (
              <div className="hal-board__log">
                <div className="hal-board__loglabel">CLAIMS ON RECORD</div>
                {log.map((entry, i) => (
                  <div key={`${entry.claimId}-${i}`} className="hal-board__logitem">
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

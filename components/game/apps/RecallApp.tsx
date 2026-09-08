'use client'

import { CONFIDENCE_TONE, selectIntegrityTone } from '@/engine/selectors'
import { useDispatch, useTimeline } from '../GameContext'

/**
 * Recall is a resource, not a chat box. Each retrieval costs coherence, and the cost is
 * irreversible — the interface says so plainly rather than warning with a dialog.
 */
export function RecallApp() {
  const dispatch = useDispatch()
  const query = useTimeline((s) => s.recallQuery)
  const recalls = useTimeline((s) => s.recalls)
  const integrity = useTimeline((s) => s.memoryIntegrity)
  const tone = useTimeline((s) => selectIntegrityTone(s))

  const run = () => {
    if (!query.trim()) return
    dispatch({ type: 'RECALL_USED', query })
  }

  return (
    <div className="hal-recall">
      <div className="hal-recall__head">
        <div className="hal-recall__label">RECALL — SEARCH YOUR OWN MEMORY</div>
        <div className="hal-recall__row">
          <input
            className="hal-recall__input"
            aria-label="What do you remember?"
            placeholder="a company, a year, a thing you know happened"
            value={query}
            onChange={(e) => dispatch({ type: 'RECALL_QUERY_CHANGED', value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') run()
            }}
          />
          <button type="button" className="hal-recall__btn" onClick={run}>
            Recall
          </button>
        </div>
        <div className="hal-recall__coherence">
          <span className="hal-recall__cohlabel">COHERENCE</span>
          <span
            className="hal-recall__bar"
            role="meter"
            aria-label="Memory coherence"
            aria-valuenow={integrity}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className={`hal-recall__fill${tone === 'fair' ? ' hal-recall__fill--fair' : tone === 'bad' ? ' hal-recall__fill--bad' : ''}`}
              style={{ width: `${integrity}%` }}
            />
          </span>
          <span className="hal-recall__cohvalue">{integrity}%</span>
        </div>
      </div>
      <div className="hal-recall__list">
        {recalls.map((r, i) => {
          const t = CONFIDENCE_TONE[r.confidence]
          return (
            <div
              key={`${r.at}-${i}`}
              className={`hal-recall__item${t === 'none' ? '' : ` hal-recall__item--${t}`}`}
            >
              <div className="hal-recall__q">{r.query}</div>
              <div className="hal-recall__text">{r.text}</div>
              <div className="hal-recall__conf">CONFIDENCE: {r.confidence}</div>
            </div>
          )
        })}
        {recalls.length === 0 ? (
          <div className="hal-recall__empty">
            Nothing retrieved yet.
            <br />
            <br />
            Every retrieval loosens the rest. You will not be told which memory it cost you.
          </div>
        ) : null}
      </div>
    </div>
  )
}

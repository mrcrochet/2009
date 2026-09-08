'use client'

import { useContent, useTimeline } from './GameContext'

/**
 * Lines the player carried back from the far side of the relay.
 *
 * They appear wherever evidence appears — the tray, and the board while a claim is being built —
 * and they are never selectable. That is the point of them. A claim made in 2009 cannot rest on
 * a document from a year nobody has reached, so the player builds their case beside a paragraph
 * they know is true and cannot use, every single time.
 *
 * The alternative was to let them accumulate somewhere the player never sees, which is the hole
 * CLAUDE.md §7 names: anything the game collects and never spends is a hole a player will feel.
 * The spend here is not mechanical. It is being right and being unable to say so.
 */
export function KeptLines({ variant }: { variant: 'tray' | 'board' }) {
  const content = useContent()
  const kept = useTimeline((s) => s.wayup.futureEvidence)
  const day = useTimeline((s) => s.day)
  const cfg = content.wayup

  if (!cfg || kept.length === 0) return null

  return (
    <div className={`hal-kept hal-kept--${variant}`} data-testid="kept-lines">
      <div className="hal-kept__head">
        {cfg.keptHeading} · {kept.length}
      </div>
      {cfg.keptNote ? <p className="hal-kept__note">{cfg.keptNote}</p> : null}
      <ul className="hal-kept__list">
        {kept.map((entry) => (
          <li key={entry.id} className="hal-kept__item" data-kept={entry.id}>
            <span className="hal-kept__excerpt">“{entry.excerpt}”</span>
            <span className="hal-kept__src">
              {entry.sourceTitle || entry.sourceUrl || entry.snapshotId}
              {entry.capturedDay !== day ? (
                <span className="hal-kept__day">
                  {' '}
                  · DAY {String(entry.capturedDay).padStart(2, '0')}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

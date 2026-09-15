'use client'

import { useContent, useInvestigation } from './GameContext'

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
  const kept = useInvestigation((s) => s.relay.kept)
  const cfg = content.relay

  if (!cfg || kept.length === 0) return null

  return (
    <div className={`nova-kept nova-kept--${variant}`} data-testid="kept-lines">
      <div className="nova-kept__head">
        {cfg.keptHeading} · {kept.length}
      </div>
      {cfg.keptNote ? <p className="nova-kept__note">{cfg.keptNote}</p> : null}
      <ul className="nova-kept__list">
        {kept.map((entry) => (
          <li key={entry.id} className="nova-kept__item" data-kept={entry.id}>
            <span className="nova-kept__excerpt">“{entry.excerpt}”</span>
            <span className="nova-kept__src">
              {entry.sourceTitle || entry.sourceUrl || entry.snapshotId}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

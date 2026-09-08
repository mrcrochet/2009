'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { isMuted, setMuted, subscribeMuted } from '@/lib/audio'

/**
 * The speaker in the menu bar. A 2009 machine put its volume there, and so does this one — it is
 * the only place a player would think to look, which is what makes it diegetic rather than a
 * settings panel bolted onto a game.
 */
export function SoundControl() {
  const muted = useSyncExternalStore(
    subscribeMuted,
    useCallback(() => isMuted(), []),
    () => false,
  )

  return (
    <button
      type="button"
      className="hal-menubar__sound"
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Turn sound on.' : 'Sound is on. Turn sound off.'}
      title={muted ? 'Sound off' : 'Sound on'}
      onClick={() => setMuted(!muted)}
    >
      <svg viewBox="0 0 14 12" width="13" height="12" aria-hidden="true" focusable="false">
        <path d="M1 4.6h2.4L6.4 2v8L3.4 7.4H1z" fill="currentColor" />
        {muted ? (
          <path d="M8.6 4.2l3.2 3.6M11.8 4.2l-3.2 3.6" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
            <path d="M8.6 4.4a2.6 2.6 0 0 1 0 3.2" />
            <path d="M10.4 3a4.8 4.8 0 0 1 0 6" opacity=".65" />
          </g>
        )}
      </svg>
    </button>
  )
}

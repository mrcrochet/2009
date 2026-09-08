'use client'

import { useContent, useTimeline } from './GameContext'

/**
 * The cliffhanger: the machine stops being yours for a moment. It is the emotional peak of Day
 * 01, so it is announced as well as lit — a player who cannot see the red indicator still gets
 * told, once, in the same words the summary uses.
 */
export function SurveillanceOverlay() {
  const content = useContent()
  const watched = useTimeline((s) => s.ui.watched)
  if (!watched) return null
  return (
    <>
      <p className="hal-sr-only" role="status">
        {content.dayEnd.watchedLine}
      </p>
      <div className="hal-watched" data-testid="surveillance" aria-hidden="true">
        <div className="hal-watched__glow" />
        <div className="hal-watched__dot" />
        <div className="hal-watched__lens" />
      </div>
    </>
  )
}

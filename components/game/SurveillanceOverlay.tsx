'use client'

import { useContent, useInvestigation } from './GameContext'

/**
 * The cliffhanger: the machine stops being yours for a moment. It is the emotional peak of Day
 * 01, so it is announced as well as lit — a player who cannot see the red indicator still gets
 * told, once, in the same words the summary uses.
 */
export function SurveillanceOverlay() {
  const content = useContent()
  const watched = useInvestigation((s) => s.ui.watched)
  if (!watched) return null
  return (
    <>
      <p className="nova-sr-only" role="status">
        {content.report.watchedLine}
      </p>
      <div className="nova-watched" data-testid="surveillance" aria-hidden="true">
        <div className="nova-watched__glow" />
        <div className="nova-watched__dot" />
        <div className="nova-watched__lens" />
      </div>
    </>
  )
}

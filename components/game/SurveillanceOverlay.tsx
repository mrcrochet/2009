'use client'

import { useTimeline } from './GameContext'

/** The cliffhanger: the machine stops being yours for a moment. */
export function SurveillanceOverlay() {
  const watched = useTimeline((s) => s.ui.watched)
  if (!watched) return null
  return (
    <div className="hal-watched" data-testid="surveillance" role="presentation">
      <div className="hal-watched__glow" />
      <div className="hal-watched__dot" />
      <div className="hal-watched__lens" />
    </div>
  )
}

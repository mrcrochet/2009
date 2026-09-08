'use client'

import { useContent, useTimeline } from './GameContext'

export function BootSequence() {
  const content = useContent()
  const line = useTimeline((s) => s.bootLine)
  const shown = content.boot.slice(0, line)

  return (
    <div className="hal-boot" data-testid="boot" role="status" aria-live="polite">
      {shown.map((text, i) => (
        <div key={i} className="hal-boot__line">
          {text || ' '}
        </div>
      ))}
      <span className="hal-boot__cursor" aria-hidden="true" />
    </div>
  )
}

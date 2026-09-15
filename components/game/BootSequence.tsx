'use client'

import { useContent, useInvestigation } from './GameContext'

export function BootSequence() {
  const content = useContent()
  const line = useInvestigation((s) => s.bootLine)
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

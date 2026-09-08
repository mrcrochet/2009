'use client'

import type { AppId, DockId } from '@/engine/types'
import { DOCK_TINT, DockGlyph } from './icons'
import { useContent, useDispatch, useTimeline } from './GameContext'

export function Dock() {
  const content = useContent()
  const dispatch = useDispatch()
  const openApps = useTimeline((s) => s.windows.map((w) => w.app).join(','))
  const phoneOpen = useTimeline((s) => s.phone.open)

  const open = new Set(openApps ? openApps.split(',') : [])

  return (
    <nav className="hal-dock" aria-label="Dock">
      {(content.dock as DockId[]).map((id) => {
        const isPhone = id === 'phone'
        const def = content.apps.find((a) => a.id === id)
        const label = isPhone ? content.phone.device : (def?.title ?? id)
        const isOpen = isPhone ? phoneOpen : open.has(id)
        const [top, bottom] = DOCK_TINT[id] ?? DOCK_TINT.term
        return (
          <button
            key={id}
            type="button"
            className="hal-dockitem"
            data-open={isOpen}
            data-dock={id}
            aria-label={isPhone ? label : isOpen ? `${label}, open` : label}
            // Only the phone is a real toggle. Clicking an open app focuses it; it does not close it.
            {...(isPhone ? { 'aria-pressed': isOpen } : {})}
            title={label}
            onClick={() => {
              if (isPhone) dispatch({ type: 'PHONE_TOGGLED' })
              else dispatch({ type: 'APP_OPENED', app: id as AppId, viewport: measure() })
            }}
          >
            <span
              className="hal-dockitem__icon"
              style={{ background: `linear-gradient(180deg, ${top}, ${bottom})` }}
            >
              <DockGlyph id={id} />
            </span>
            <span className="hal-dockitem__dot" aria-hidden="true" />
          </button>
        )
      })}
    </nav>
  )
}

function measure() {
  if (typeof window === 'undefined') return undefined
  return { width: window.innerWidth, height: window.innerHeight }
}

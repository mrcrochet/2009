'use client'

import { RELAY_APP } from '@/engine/reducer'
import type { AppId, DockId } from '@/engine/types'
import { relayRunning } from '@/engine/machine/processes'
import { DockGlyph } from './icons'
import { useContent, useDispatch, useInvestigation } from './GameContext'

export function Dock() {
  const content = useContent()
  const dispatch = useDispatch()
  const openApps = useInvestigation((s) => s.windows.map((w) => w.app).join(','))
  const phoneOpen = useInvestigation((s) => s.phone.open)
  const relayFound = useInvestigation((s) => relayRunning(s, content))

  const open = new Set(openApps ? openApps.split(',') : [])

  return (
    <nav className="nova-dock" aria-label="Dock">
      {(content.dock as DockId[])
        // A case that supplies no phone does not put one in the dock.
        .filter((id) => id !== 'phone' || content.phone !== null)
        /*
         * The relay is a process the investigator has to find running — and the word is meant
         * literally.
         *
         * A dock icon for it from the first minute would answer, before anybody has asked, the
         * one question the case makes them work for. It appears when the machine admits the
         * process exists, and it goes when the process does, because an icon for an application
         * that refuses to open says the machine is broken rather than that the player broke it.
         */
        .filter((id) => id !== RELAY_APP || relayFound)
        .map((id) => {
          const isPhone = id === 'phone'
          const def = content.apps.find((a) => a.id === id)
          const label = isPhone ? (content.phone?.device ?? 'Phone') : (def?.title ?? id)
          const isOpen = isPhone ? phoneOpen : open.has(id)
          return (
            <button
              key={id}
              type="button"
              className="nova-dockitem"
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
              {/*
                One surface for every application, and the glyph carries the identity.
                A row of individually tinted tiles is a phone's home screen; a tool's dock is
                monochrome, and the only colour on it says which one is running.
              */}
              <span className="nova-dockitem__icon">
                <DockGlyph id={id} />
              </span>
              <span className="nova-dockitem__dot" aria-hidden="true" />
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

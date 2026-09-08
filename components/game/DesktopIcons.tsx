'use client'

import { useContent, useDispatch, useTimeline } from './GameContext'

/** The README appears on the desktop a beat after the machine settles. */
export function DesktopIcons() {
  const content = useContent()
  const dispatch = useDispatch()
  const icons = useTimeline((s) => s.desktopIcons)

  if (icons.length === 0) return null

  return (
    <div className="hal-icons">
      {icons.map((iconId) => {
        const doc = content.files.find((f) => f.id === iconId)
        if (!doc) return null
        return (
          <button
            key={iconId}
            type="button"
            className="hal-icon"
            onDoubleClick={() => open(iconId)}
            onClick={() => open(iconId)}
          >
            <span className="hal-icon__doc" aria-hidden="true">
              <span className="hal-icon__fold" />
              <span className="hal-icon__lines">
                <span />
                <span />
                <span />
              </span>
            </span>
            <span className="hal-icon__label">{doc.name}</span>
          </button>
        )
      })}
    </div>
  )

  function open(fileId: string) {
    dispatch({ type: 'APP_OPENED', app: 'files', viewport: measure() })
    dispatch({ type: 'FILE_OPENED', fileId })
  }
}

function measure() {
  if (typeof window === 'undefined') return undefined
  return { width: window.innerWidth, height: window.innerHeight }
}

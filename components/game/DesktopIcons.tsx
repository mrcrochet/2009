'use client'

import { FileIcon } from './FileIcon'
import { useContent, useDispatch, useInvestigation } from './GameContext'
import { useQuickLookKey } from './useQuickLook'

/** The README appears on the desktop a beat after the machine settles. */
export function DesktopIcons() {
  const content = useContent()
  const dispatch = useDispatch()
  const icons = useInvestigation((s) => s.desktopIcons)
  const quickLook = useQuickLookKey()

  if (icons.length === 0) return null

  return (
    <div className="nova-icons">
      {icons.map((iconId) => {
        const doc = content.files.find((f) => f.id === iconId)
        if (!doc) return null
        return (
          <button
            key={iconId}
            type="button"
            className="nova-icon"
            data-file={iconId}
            onClick={() => open(iconId)}
            // Space on a file on the desktop is Quick Look, and always has been.
            onKeyDown={quickLook({ kind: 'file', id: iconId })}
          >
            <span className="nova-icon__art">
              <FileIcon kind={doc.kind} size={54} />
            </span>
            <span className="nova-icon__label">{doc.name}</span>
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

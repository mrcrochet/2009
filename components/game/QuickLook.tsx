'use client'

import { useEffect, useRef } from 'react'
import { selectQuickLook } from '@/engine/selectors'
import { DocumentView } from './DocumentView'
import { PhotoFrame } from './PhotoFrame'
import { PinButton } from './PinButton'
import { useContent, useDispatch, useInvestigation } from './GameContext'
import { useFocusTrap } from './useFocusTrap'

const KIND_LABEL: Record<string, string> = {
  note: 'PLAIN TEXT',
  letter: 'DOCUMENT',
  sheet: 'SPREADSHEET',
  scan: 'SCAN',
  audio: 'RECORDING',
  encrypted: 'ENCRYPTED',
}

/**
 * Space, and the document comes up over everything.
 *
 * It is the one gesture on this machine that reads without opening: a player working a list of
 * eight files should be able to look at all eight without eight windows, and close the last one
 * with the same key that opened it. What it shows is the document itself — the same
 * `DocumentView` the reader uses — because a preview that is a reduced version of a document is
 * a second place for a document to be wrong.
 */
export function QuickLook() {
  const content = useContent()
  const dispatch = useDispatch()
  const held = useInvestigation((s) => selectQuickLook(s, content))
  const panelRef = useRef<HTMLDivElement>(null)
  const open = held !== null
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      // Escape, and Space again — the key that held it up puts it down.
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        dispatch({ type: 'QUICK_LOOK_CLOSED' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dispatch])

  if (!held) return null

  const title = held.kind === 'file' ? held.document.name : held.photo.label
  const meta = held.kind === 'file' ? held.document.meta : held.photo.meta
  const label = held.kind === 'file' ? (KIND_LABEL[held.document.kind] ?? 'DOCUMENT') : 'PHOTOGRAPH'

  return (
    <div className="nova-ql" data-testid="quick-look">
      <div
        className="nova-ql__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick Look — ${title}`}
        tabIndex={-1}
      >
        <div className="nova-ql__head">
          <span className="nova-ql__kind">{label}</span>
          <span className="nova-ql__title">{title}</span>
          <span className="nova-ql__meta">{meta}</span>
          <button
            type="button"
            className="nova-ql__close"
            aria-label="Put it down"
            onClick={() => dispatch({ type: 'QUICK_LOOK_CLOSED' })}
          >
            ×
          </button>
        </div>

        <div className="nova-ql__body">
          {held.kind === 'file' ? (
            <DocumentView document={held.document} via="files" variant="quicklook" />
          ) : (
            <div className="nova-ql__photo">
              <div className="nova-ql__frame">
                <PhotoFrame subject={held.photo.subject} label={held.photo.label} />
              </div>
              <ul className="nova-ql__exif">
                {held.photo.detail.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              {held.photo.evidenceId ? (
                <div className="nova-doc__foot">
                  <PinButton evidenceId={held.photo.evidenceId} via="device" />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="nova-ql__foot">Space or Escape to put it down</div>
      </div>
    </div>
  )
}

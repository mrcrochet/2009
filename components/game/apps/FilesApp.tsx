'use client'

import { selectFiles, selectOpenDocument } from '@/engine/selectors'
import { DocumentView } from '../DocumentView'
import { FileIcon } from '../FileIcon'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { useQuickLookKey } from '../useQuickLook'

export function FilesApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const files = useInvestigation((s) => selectFiles(s, content))
  const open = useInvestigation((s) => selectOpenDocument(s, content))
  const quickLook = useQuickLookKey()

  return (
    <>
      <div className="nova-files__places">
        <div className="nova-files__placeshead">PLACES</div>
        <div className="nova-files__place nova-files__place--active">Desktop</div>
        <div className="nova-files__place">Documents</div>
        <div className="nova-files__place">Pictures</div>
        <div className="nova-files__place nova-files__place--off">Network</div>
      </div>
      <div className="nova-files__list" role="listbox" aria-label="Desktop">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            role="option"
            className="nova-files__row"
            aria-selected={f.selected}
            onClick={() => dispatch({ type: 'FILE_OPENED', fileId: f.id })}
            // Space holds a document up without opening it, the way Space always has.
            onKeyDown={quickLook({ kind: 'file', id: f.id })}
          >
            <span className="nova-files__label">
              <span className="nova-files__icon">
                <FileIcon kind={f.kind} size={18} />
              </span>
              <span className="nova-files__name">{f.name}</span>
            </span>
            <span className="nova-files__meta">{f.meta}</span>
          </button>
        ))}
      </div>
      <div className="nova-files__body">
        {open ? (
          <>
            <div className="nova-files__docbar">
              <span className="nova-files__docname">{open.name}</span>
              <span className="nova-files__docmeta">{open.meta}</span>
            </div>
            <DocumentView document={open} via="files" />
          </>
        ) : null}
      </div>
    </>
  )
}

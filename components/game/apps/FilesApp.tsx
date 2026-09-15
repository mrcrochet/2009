'use client'

import { selectFileBody, selectFileEvidenceId, selectFiles } from '@/engine/selectors'
import { FileIcon } from '../FileIcon'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { PinButton } from '../PinButton'

export function FilesApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const files = useInvestigation((s) => selectFiles(s, content))
  const body = useInvestigation((s) => selectFileBody(s, content))
  const evidenceId = useInvestigation((s) => selectFileEvidenceId(s, content))

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
          >
            <span className="nova-files__label">
              <span className="nova-files__icon">
                <FileIcon kind={f.icon} size={18} />
              </span>
              <span className="nova-files__name">{f.name}</span>
            </span>
            <span className="nova-files__meta">{f.meta}</span>
          </button>
        ))}
      </div>
      <div className="nova-files__body">
        <pre className="nova-files__text">{body}</pre>
        {evidenceId ? <PinButton evidenceId={evidenceId} via="files" /> : null}
      </div>
    </>
  )
}

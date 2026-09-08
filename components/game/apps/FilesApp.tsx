'use client'

import { selectFileBody, selectFileEvidenceId, selectFiles } from '@/engine/selectors'
import { FileIcon } from '../FileIcon'
import { useContent, useDispatch, useTimeline } from '../GameContext'
import { PinButton } from '../PinButton'

export function FilesApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const files = useTimeline((s) => selectFiles(s, content))
  const body = useTimeline((s) => selectFileBody(s, content))
  const evidenceId = useTimeline((s) => selectFileEvidenceId(s, content))

  return (
    <>
      <div className="hal-files__places">
        <div className="hal-files__placeshead">PLACES</div>
        <div className="hal-files__place hal-files__place--active">Desktop</div>
        <div className="hal-files__place">Documents</div>
        <div className="hal-files__place">Pictures</div>
        <div className="hal-files__place hal-files__place--off">Network</div>
      </div>
      <div className="hal-files__list" role="listbox" aria-label="Desktop">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            role="option"
            className="hal-files__row"
            aria-selected={f.selected}
            onClick={() => dispatch({ type: 'FILE_OPENED', fileId: f.id })}
          >
            <span className="hal-files__label">
              <span className="hal-files__icon">
                <FileIcon kind={f.icon} size={18} />
              </span>
              <span className="hal-files__name">{f.name}</span>
            </span>
            <span className="hal-files__meta">{f.meta}</span>
          </button>
        ))}
      </div>
      <div className="hal-files__body">
        <pre className="hal-files__text">{body}</pre>
        {evidenceId ? <PinButton evidenceId={evidenceId} via="files" /> : null}
      </div>
    </>
  )
}

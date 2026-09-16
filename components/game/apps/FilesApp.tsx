'use client'

import { crumbs } from '@/engine/machine/shell'
import { parentOf } from '@/engine/machine/vfs'
import { selectFiles, selectOpenDocument, selectPlaces } from '@/engine/selectors'
import { DocumentView } from '../DocumentView'
import { FileIcon } from '../FileIcon'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { useQuickLookKey } from '../useQuickLook'

/**
 * The file manager, over the machine's own filesystem.
 *
 * It used to be a flat pane of everything the case had authored, under a sidebar of four words
 * that did nothing. It walks a tree now — the same tree the shell walks — so a volume appears in
 * Places when its source is opened, a folder is something you go into, and the passcode file on
 * somebody's disk image is somewhere a player has to go and find rather than something the case
 * hands over at the door.
 */
export function FilesApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const cwd = useInvestigation((s) => s.files.cwd)
  const rows = useInvestigation((s) => selectFiles(s, content))
  const places = useInvestigation((s) => selectPlaces(s, content))
  const open = useInvestigation((s) => selectOpenDocument(s, content))
  const quickLook = useQuickLookKey()

  const go = (path: string) => dispatch({ type: 'FILES_NAVIGATED', path })
  const trail = crumbs(cwd)

  return (
    <>
      <div className="nova-files__places">
        <div className="nova-files__placeshead">PLACES</div>
        {places.map((place) => (
          <button
            key={place.path}
            type="button"
            className="nova-files__place"
            data-place={place.name}
            aria-current={cwd === place.path || cwd.startsWith(`${place.path}/`)}
            // A locked source is on the machine and unreadable, which is a different thing from
            // absent — so it is listed, and saying so is its whole job.
            aria-disabled={place.locked}
            onClick={() => !place.locked && go(place.path)}
          >
            <span className="nova-files__placename">{place.name}</span>
            {place.locked ? <span className="nova-files__lockedtag">locked</span> : null}
          </button>
        ))}
      </div>

      <div className="nova-files__list">
        <div className="nova-files__crumbs" aria-label="Location">
          <button
            type="button"
            className="nova-files__up"
            aria-label="Enclosing folder"
            aria-disabled={cwd === '/'}
            onClick={() => cwd !== '/' && go(parentOf(cwd))}
          >
            ‹
          </button>
          {trail.map((crumb, i) => (
            <span key={crumb.path}>
              {i > 0 ? <span className="nova-files__sep">/</span> : null}
              <button type="button" className="nova-files__crumb" onClick={() => go(crumb.path)}>
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        <div className="nova-files__rows" role="listbox" aria-label={cwd}>
          {rows.length === 0 ? (
            <div className="nova-files__empty">Empty folder</div>
          ) : null}
          {rows.map((row) => (
            <button
              key={row.path}
              type="button"
              role="option"
              className="nova-files__row"
              data-type={row.type}
              aria-selected={row.selected}
              onClick={() => {
                if (row.type !== 'file') {
                  if (!row.locked) go(row.path)
                  return
                }
                if (row.fileId) dispatch({ type: 'FILE_OPENED', fileId: row.fileId })
                else if (row.photoId) dispatch({ type: 'PHOTO_SELECTED', photoId: row.photoId })
              }}
              // Space holds a document up without opening it, the way Space always has.
              onKeyDown={
                row.fileId
                  ? quickLook({ kind: 'file', id: row.fileId })
                  : row.photoId
                    ? quickLook({ kind: 'photo', id: row.photoId })
                    : undefined
              }
            >
              <span className="nova-files__label">
                <span className="nova-files__icon">
                  {row.type === 'file' ? (
                    <FileIcon kind={row.kind} size={18} />
                  ) : (
                    <FolderIcon volume={row.type === 'volume'} locked={row.locked} />
                  )}
                </span>
                <span className="nova-files__name">{row.name}</span>
              </span>
              <span className="nova-files__meta">{row.meta}</span>
            </button>
          ))}
        </div>
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
        ) : (
          <div className="nova-files__nothing">No document open</div>
        )}
      </div>
    </>
  )
}

/** Hand-drawn, like every other icon on this machine. A volume is a disk, not a folder. */
function FolderIcon({ volume, locked }: { volume: boolean; locked: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
      opacity={locked ? 0.45 : 1}
    >
      {volume ? (
        <>
          <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
          <circle cx="10" cy="10" r="2.4" />
        </>
      ) : (
        <path d="M2.5 5.5h5l1.5 2h8.5v9h-15z" />
      )}
    </svg>
  )
}

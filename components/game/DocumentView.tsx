'use client'

import { groupDigits, groupDigitsIn, parseSheet } from '@/engine/documents'
import type { DocumentModel } from '@/engine/selectors'
import type { EvidenceSourceKind } from '@/engine/types'
import { AudioPlayer } from './AudioPlayer'
import { PinButton } from './PinButton'

/**
 * A document, shown as the thing it is.
 *
 * Every document on this machine used to arrive at the player as the same block of monospace
 * text: a parking receipt, a spreadsheet with eleven rows in it and a man's unsent letter to the
 * Department of Justice all looked identical, and the only way to tell them apart was to read
 * them. A case that has gone to the trouble of writing a spreadsheet is entitled to have it
 * *look* like a spreadsheet — the shape of a document is evidence too, and a player recognises a
 * receipt across the room.
 *
 * The nature comes from the case (`kind`); the reading of it happens in `engine/documents.ts`;
 * this file only draws. Nothing here decides what a document says.
 */
export function DocumentView({
  document,
  via,
  variant = 'reader',
}: {
  document: DocumentModel
  via: EvidenceSourceKind
  /** `quicklook` is the same document, given the whole overlay and a little more room. */
  variant?: 'reader' | 'quicklook'
}) {
  return (
    <div className="nova-doc" data-kind={document.kind} data-variant={variant}>
      <div className="nova-doc__sheet">
        {document.sealed ? <Sealed document={document} /> : <Body document={document} />}
      </div>
      {document.evidenceId ? (
        <div className="nova-doc__foot">
          <PinButton evidenceId={document.evidenceId} via={via} />
        </div>
      ) : null}
    </div>
  )
}

function Body({ document }: { document: DocumentModel }) {
  switch (document.kind) {
    case 'letter':
      return <Letter body={document.body} />
    case 'sheet':
      return <Sheet body={document.body} />
    case 'scan':
      return <Scan document={document} />
    case 'audio':
      return <Recording document={document} />
    case 'encrypted':
    case 'note':
    default:
      return <pre className="nova-doc__note">{document.body}</pre>
  }
}

/** Somebody's word processor: a page, margins, and paragraphs set for reading. */
function Letter({ body }: { body: string }) {
  const paragraphs = body.split('\n').filter((line) => line.trim() !== '')
  return (
    <div className="nova-doc__page">
      {paragraphs.map((line, i) => (
        <p
          key={i}
          className="nova-doc__para"
          // A bracketed line is the author talking about the document, not a paragraph in it.
          data-aside={line.startsWith('[') && line.endsWith(']')}
        >
          {line}
        </p>
      ))}
    </div>
  )
}

/**
 * A spreadsheet, as a spreadsheet: numbered rows, a header band, numeric columns right-aligned
 * and grouped, and — the reason this is worth building — the comment somebody left in a cell,
 * pinned in the margin where a spreadsheet would put it.
 */
function Sheet({ body }: { body: string }) {
  const table = parseSheet(body)
  if (table.columns.length === 0) return <pre className="nova-doc__note">{body}</pre>

  return (
    <div className="nova-doc__grid">
      <table className="nova-sheet">
        <thead>
          <tr>
            <th scope="col" className="nova-sheet__rownum">
              <span className="nova-sr-only">Row</span>
            </th>
            {table.columns.map((column, i) => (
              <th key={i} scope="col" data-align={table.align[i]}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              <th scope="row" className="nova-sheet__rownum">
                {r + 1}
              </th>
              {row.map((cell, c) => (
                <td key={c} data-align={table.align[c]}>
                  {table.align[c] === 'right' ? groupDigits(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {table.total ? (
          <tfoot>
            <tr>
              <td className="nova-sheet__rownum" />
              <td colSpan={table.columns.length}>{groupDigitsIn(table.total)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>

      {table.notes.length > 0 ? (
        <div className="nova-sheet__notes">
          {table.notes.map((note, i) => (
            <div key={i} className="nova-sheet__note" data-anchored={note.anchor !== null}>
              {note.anchor ? <span className="nova-sheet__anchor">{note.anchor}</span> : null}
              <span>{note.text}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Paper that went through a scanner.
 *
 * Slightly off square, with the shadow the lid leaves down one edge — a receipt is a photograph
 * of a receipt, and a player should be able to tell at a glance that nobody typed this.
 */
function Scan({ document }: { document: DocumentModel }) {
  return (
    <div className="nova-doc__bed">
      <div className="nova-doc__paper">
        <pre className="nova-doc__scanned">{document.body}</pre>
      </div>
      <div className="nova-doc__scanstrip" aria-hidden="true" />
    </div>
  )
}

function Recording({ document }: { document: DocumentModel }) {
  if (!document.audio) return <pre className="nova-doc__note">{document.body}</pre>
  return (
    <div className="nova-doc__recording">
      <AudioPlayer key={document.id} id={document.id} audio={document.audio} />
      {document.body ? <p className="nova-doc__filenote">{document.body}</p> : null}
    </div>
  )
}

/** Sealed. What it will turn out to be is not previewed, because that would be the answer. */
function Sealed({ document }: { document: DocumentModel }) {
  return (
    <div className="nova-doc__sealed">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path
          d="M7 10.5V7.4a5 5 0 0 1 10 0v3.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <rect
          x="4.6"
          y="10.5"
          width="14.8"
          height="10.4"
          rx="1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
      <pre className="nova-doc__note">{document.body}</pre>
    </div>
  )
}

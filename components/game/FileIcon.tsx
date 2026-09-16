/**
 * File icons for NOVA 3.2. Hand-drawn SVG: a warm off-white page with a folded corner, a sealed
 * binary, a sheet of ruled cells. Never emoji, never a modern flat pictogram, never an
 * icon-library import.
 *
 * The glyph is derived from the document's *nature*, which the case declares, so a file can no
 * longer say it is a photograph in a list and a column of text in the reader. One geometry
 * serves both sizes — the 44×54 desktop icon and the 16px row icon in Files — so a document
 * looks like the same object wherever the player meets it.
 */
import type { DocumentKind } from '@/engine/case-schema'

const PAPER_ID = 'nova-icn-paper'
const SEAL_ID = 'nova-icn-seal'

export function FileIcon({ kind, size = 54 }: { kind: DocumentKind; size?: number }) {
  const width = Math.round((size * 44) / 54)
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 44 54"
      fill="none"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <defs>
        <linearGradient id={PAPER_ID} x1="0" y1="0" x2="0.36" y2="1">
          <stop offset="0" stopColor="#f6f6f2" />
          <stop offset="1" stopColor="#d3d3cb" />
        </linearGradient>
        <linearGradient id={SEAL_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7a85" />
          <stop offset="1" stopColor="#3d454e" />
        </linearGradient>
      </defs>
      <Page kind={kind} />
    </svg>
  )
}

/** The document body: one page, with its 15px corner fold. */
function Page({ kind }: { kind: DocumentKind }) {
  return (
    <g>
      {/* An intact sheet with a 2px radius — the handoff's page is not notched. */}
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="53"
        rx="2"
        fill={`url(#${PAPER_ID})`}
        stroke="#9a9a92"
        strokeWidth="1"
      />
      {/* The fold is drawn over the corner, as a 15×15 shaded triangle. */}
      <path d="M29 1L43 15H29Z" fill="#b9b9b0" />
      {kind === 'note' ? <TextLines /> : null}
      {kind === 'letter' ? <Prose /> : null}
      {kind === 'sheet' ? <Cells /> : null}
      {kind === 'scan' ? <Photograph /> : null}
      {kind === 'audio' ? <Waveform /> : null}
      {kind === 'encrypted' ? <Sealed /> : null}
    </g>
  )
}

/** Three rules at 11 / 15.5 / 20, the last at 70% — the handoff's exact geometry. */
function TextLines() {
  return (
    <g fill="#a8a8a0">
      <rect x="7" y="11" width="30" height="1.5" />
      <rect x="7" y="15.5" width="30" height="1.5" />
      <rect x="7" y="20" width="21" height="1.5" />
    </g>
  )
}

/** A typed page: a heading block and justified body. Somebody wrote this one. */
function Prose() {
  return (
    <g fill="#a8a8a0">
      <rect x="7" y="22" width="16" height="2.6" fill="#8d8d85" />
      <rect x="7" y="29" width="30" height="1.5" />
      <rect x="7" y="33" width="30" height="1.5" />
      <rect x="7" y="37" width="30" height="1.5" />
      <rect x="7" y="41" width="18" height="1.5" />
    </g>
  )
}

/** Ruled cells with a filled header row. */
function Cells() {
  return (
    <g>
      <rect x="7" y="24" width="30" height="5" fill="#9aa79a" />
      <g stroke="#a8a8a0" strokeWidth="1">
        <rect x="7.5" y="24.5" width="29" height="19" fill="none" />
        <path d="M7 34h30M7 39h30M17 24v19M27 24v19" />
      </g>
    </g>
  )
}

/** A photograph pasted onto the page: horizon, sun, two hills. */
function Photograph() {
  return (
    <g>
      <rect x="7" y="26" width="30" height="21" fill="#e8eaea" stroke="#a8a8a0" strokeWidth="1" />
      <rect x="8" y="23" width="28" height="12" fill="#b9cbd6" />
      <circle cx="30" cy="28" r="3" fill="#e6d8a8" />
      <path d="M8 35L16 26L22 32L28 27L36 35V42H8Z" fill="#8fa08a" />
    </g>
  )
}

/** A recording: bars either side of a centre line. */
function Waveform() {
  return (
    <g fill="#8d97a0">
      <rect x="7" y="33" width="30" height="1" opacity="0.5" />
      <rect x="9" y="29" width="2" height="9" />
      <rect x="13" y="25" width="2" height="17" />
      <rect x="17" y="31" width="2" height="5" />
      <rect x="21" y="23" width="2" height="21" />
      <rect x="25" y="28" width="2" height="11" />
      <rect x="29" y="32" width="2" height="3" />
      <rect x="33" y="27" width="2" height="13" />
    </g>
  )
}

/** A sealed file: hex spill under a padlock. */
function Sealed() {
  return (
    <g>
      <g fill="#b3b3aa" fontFamily="Monaco, 'Courier New', monospace" fontSize="4.6">
        <text x="7" y="24">
          1f 8b 08 00
        </text>
        <text x="7" y="30">
          4d 61 72 63
        </text>
        <text x="7" y="36">
          96 fd de 5f
        </text>
      </g>
      <g transform="translate(15 30)">
        <path
          d="M3.4 5.2V3.6a3.1 3.1 0 0 1 6.2 0v1.6"
          fill="none"
          stroke="#3d454e"
          strokeWidth="1.6"
        />
        <rect
          x="0.5"
          y="5.2"
          width="12"
          height="9.4"
          rx="1.4"
          fill={`url(#${SEAL_ID})`}
          stroke="#2b3239"
          strokeWidth="1"
        />
        <circle cx="6.5" cy="9.4" r="1.5" fill="#cdd5db" />
        <rect x="5.8" y="9.4" width="1.4" height="3.2" fill="#cdd5db" />
      </g>
    </g>
  )
}

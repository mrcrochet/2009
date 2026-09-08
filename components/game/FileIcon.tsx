/**
 * File icons for HALCYON 4.1. Hand-drawn SVG in the idiom of a 2009 desktop: a warm off-white
 * page with a folded corner, a manila folder, a sealed binary. Never emoji, never a modern flat
 * pictogram, never an icon-library import.
 *
 * One geometry serves both sizes — the 44×54 desktop icon and the 16px row icon in Files — so a
 * file looks like the same object wherever the player meets it.
 */
type FileIconKind = 'document' | 'encrypted' | 'folder' | 'image'

const PAPER_ID = 'hal-icn-paper'
const FOLDER_ID = 'hal-icn-folder'
const SEAL_ID = 'hal-icn-seal'

export function FileIcon({ kind, size = 54 }: { kind: FileIconKind; size?: number }) {
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
        <linearGradient id={FOLDER_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d79a" />
          <stop offset="1" stopColor="#d3ac5c" />
        </linearGradient>
        <linearGradient id={SEAL_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7a85" />
          <stop offset="1" stopColor="#3d454e" />
        </linearGradient>
      </defs>
      {kind === 'folder' ? <Folder /> : <Page kind={kind} />}
    </svg>
  )
}

/** The document body: the exact page from the handoff, with its 15px corner fold. */
function Page({ kind }: { kind: Exclude<FileIconKind, 'folder'> }) {
  return (
    <g>
      <path
        d="M0.5 0.5H28.5L43.5 15.5V53.5H0.5Z"
        fill={`url(#${PAPER_ID})`}
        stroke="#9a9a92"
        strokeWidth="1"
      />
      {/* The folded corner, shaded as if the sheet turns back on itself. */}
      <path d="M28.5 0.5L43.5 15.5H28.5Z" fill="#b9b9b0" stroke="#9a9a92" strokeWidth="1" />
      {kind === 'document' ? <TextLines /> : null}
      {kind === 'image' ? <Photograph /> : null}
      {kind === 'encrypted' ? <Sealed /> : null}
    </g>
  )
}

function TextLines() {
  return (
    <g fill="#a8a8a0">
      <rect x="7" y="21" width="30" height="1.5" />
      <rect x="7" y="25.5" width="30" height="1.5" />
      <rect x="7" y="30" width="21" height="1.5" />
      <rect x="7" y="34.5" width="30" height="1.5" />
      <rect x="7" y="39" width="26" height="1.5" />
    </g>
  )
}

/** A photo pasted onto the page: horizon, sun, two hills. */
function Photograph() {
  return (
    <g>
      <rect x="7" y="22" width="30" height="21" fill="#e8eaea" stroke="#a8a8a0" strokeWidth="1" />
      <rect x="8" y="23" width="28" height="12" fill="#b9cbd6" />
      <circle cx="30" cy="28" r="3" fill="#e6d8a8" />
      <path d="M8 35L16 26L22 32L28 27L36 35V42H8Z" fill="#8fa08a" />
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
      <g transform="translate(15 33)">
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

/** A manila folder with a raised tab. */
function Folder() {
  return (
    <g>
      <path
        d="M1.5 12.5H17L20.5 17.5H42.5V45.5H1.5Z"
        fill={`url(#${FOLDER_ID})`}
        stroke="#8a6a28"
        strokeWidth="1"
      />
      <path d="M1.5 22.5H42.5" stroke="#c49a4c" strokeWidth="1" />
    </g>
  )
}

export type { FileIconKind }

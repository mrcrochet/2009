/**
 * Frames off a 2009 phone camera. Low light, hard flash, no depth of field — drawn rather than
 * hatched, because IMG_0114 is evidence and the player has to be able to read it.
 */
type PhotoSubject = 'parking-structure' | 'interior-night' | 'scanned-page'

export function PhotoFrame({ subject, label }: { subject: PhotoSubject; label: string }) {
  return (
    <svg
      viewBox="0 0 240 78"
      preserveAspectRatio="xMidYMid slice"
      className="hal-phone__frame"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`hal-ph-${subject}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3339" />
          <stop offset="1" stopColor="#161b1f" />
        </linearGradient>
        <radialGradient id={`hal-ph-${subject}-flash`} cx="0.5" cy="0.45" r="0.62">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {subject === 'parking-structure' ? <ParkingStructure /> : null}
      {subject === 'interior-night' ? <InteriorNight /> : null}
      {subject === 'scanned-page' ? <ScannedPage /> : null}

      {subject === 'scanned-page' ? null : (
        <rect width="240" height="78" fill={`url(#hal-ph-${subject}-flash)`} />
      )}
    </svg>
  )
}

/** Concrete deck, pillars, a car with its lights off, and the flash blowing out the nearest post. */
function ParkingStructure() {
  return (
    <g>
      <rect width="240" height="78" fill="url(#hal-ph-parking-structure-sky)" />
      <rect y="14" width="240" height="6" fill="#3a444c" />
      <rect y="58" width="240" height="20" fill="#20272c" />
      <g fill="#39434b">
        <rect x="14" y="18" width="16" height="42" />
        <rect x="96" y="20" width="13" height="38" />
        <rect x="182" y="19" width="18" height="40" />
      </g>
      <rect x="14" y="18" width="4" height="42" fill="#59656e" />
      <rect x="182" y="19" width="4" height="40" fill="#4b5760" />
      {/* Painted bay lines running off toward the ramp. */}
      <g stroke="#5c6a72" strokeWidth="1.4" opacity="0.75">
        <path d="M40 78L58 60" />
        <path d="M92 78L100 60" />
        <path d="M150 78L146 60" />
      </g>
      {/* A sedan, three-quarters on, no lights. */}
      <g>
        <path
          d="M118 56h44l9 -11h-24l-6 -7h-16l-4 7h-9z"
          fill="#39434c"
          stroke="#6d7c88"
          strokeWidth="1.3"
        />
        <path d="M131 45h13l4 6h-19z" fill="#5d6d79" opacity="0.9" />
        <circle cx="127" cy="57" r="4" fill="#161a1e" />
        <circle cx="158" cy="57" r="4" fill="#161a1e" />
      </g>
      <rect x="203" y="30" width="20" height="12" fill="#4c5860" opacity="0.6" />
    </g>
  )
}

/** A room lit by one lamp, shot without flash. Nothing in it is legible, which is the point. */
function InteriorNight() {
  return (
    <g>
      <rect width="240" height="78" fill="#12161a" />
      <rect x="150" y="8" width="46" height="62" fill="#1b2126" />
      <rect x="156" y="14" width="34" height="34" fill="#232a30" />
      <circle cx="66" cy="30" r="17" fill="#3a3325" opacity="0.85" />
      <circle cx="66" cy="30" r="8" fill="#6b5c34" opacity="0.9" />
      <rect x="58" y="38" width="16" height="30" fill="#20262b" />
      <rect y="66" width="240" height="12" fill="#0d1114" />
    </g>
  )
}

/** A page on a flatbed, slightly skewed, too small to read. */
function ScannedPage() {
  return (
    <g>
      <rect width="240" height="78" fill="#c9ced4" />
      <g transform="rotate(-1.6 120 39)">
        <rect
          x="42"
          y="4"
          width="156"
          height="76"
          fill="#f4f2ec"
          stroke="#a8a8a0"
          strokeWidth="1"
        />
        <g fill="#b7b5ac">
          <rect x="56" y="16" width="76" height="4" />
          <rect x="56" y="28" width="128" height="2.4" />
          <rect x="56" y="35" width="128" height="2.4" />
          <rect x="56" y="42" width="112" height="2.4" />
          <rect x="56" y="49" width="128" height="2.4" />
          <rect x="56" y="56" width="64" height="2.4" />
        </g>
      </g>
    </g>
  )
}

export type { PhotoSubject }

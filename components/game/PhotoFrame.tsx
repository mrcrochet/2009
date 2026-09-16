/**
 * Frames off a phone camera at night. Low light, hard flash, no depth of field — drawn rather
 * than hatched, because IMG_2214 is evidence and the player has to be able to read it.
 *
 * Four by three, which is what a camera gives you. It was 240×78 — a letterbox sliver sized for
 * one thumbnail on one handset — and a contact sheet of slivers is not a contact sheet. The
 * compositions are built to survive a crop at the top and bottom, so the same drawing serves the
 * grid, the viewer and the phone's own roll.
 */
type PhotoSubject = 'parking-structure' | 'interior-night' | 'scanned-page'

export function PhotoFrame({ subject, label }: { subject: PhotoSubject; label: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      preserveAspectRatio="xMidYMid slice"
      className="nova-frame"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`nova-ph-${subject}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3339" />
          <stop offset="1" stopColor="#161b1f" />
        </linearGradient>
        {/*
          The fall-off, not the flash.

          A white radial over the whole frame was a floodlight: it lifted the black off the deck,
          every tone collapsed toward the same grey and the car stopped reading as a car. What a
          phone flash does is take the nearest few feet and give up, so the light belongs *in* the
          scene, on the surfaces it actually reaches, and what goes over the top is only the dark
          closing in at the edges.
        */}
        <radialGradient id={`nova-ph-${subject}-flash`} cx="0.44" cy="0.58" r="0.72">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.55" stopColor="#000000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.62" />
        </radialGradient>
      </defs>

      {subject === 'parking-structure' ? <ParkingStructure /> : null}
      {subject === 'interior-night' ? <InteriorNight /> : null}
      {subject === 'scanned-page' ? <ScannedPage /> : null}

      {subject === 'scanned-page' ? null : (
        <rect width="240" height="180" fill={`url(#nova-ph-${subject}-flash)`} />
      )}
    </svg>
  )
}

/**
 * A concrete deck: low ceiling, one strip light, pillars, painted bays running off to the ramp,
 * and a sedan with its lights off. The flash takes the nearest pillar and gives up after that.
 */
function ParkingStructure() {
  return (
    <g>
      <rect width="240" height="180" fill="url(#nova-ph-parking-structure-sky)" />

      {/* Ceiling slab and the one fitting that works. */}
      <rect width="240" height="30" fill="#161c21" />
      <rect y="30" width="240" height="5" fill="#2b343b" />
      <rect x="86" y="14" width="52" height="5" fill="#e7eef2" />
      <rect x="86" y="19" width="52" height="10" fill="#7b8790" opacity="0.28" />

      {/* Deck: dark at the back, and only lit where the flash gets to it. */}
      <rect y="132" width="240" height="48" fill="#151a1e" />
      <rect y="130" width="240" height="3" fill="#232b31" />
      <ellipse cx="96" cy="166" rx="86" ry="34" fill="#39434a" opacity="0.55" />

      {/* Pillars, near to far — and the near one is the only thing properly lit. */}
      <g fill="#232a30">
        <rect x="104" y="40" width="15" height="92" />
        <rect x="192" y="37" width="21" height="95" />
      </g>
      <rect x="8" y="35" width="26" height="97" fill="#4a555e" />
      <rect x="8" y="35" width="7" height="97" fill="#8a97a1" />
      <rect x="30" y="35" width="4" height="97" fill="#2c343a" />
      <rect x="192" y="37" width="4" height="95" fill="#39434a" />
      {/* A bay number stencilled on the near pillar, blown out by the flash. */}
      <rect x="17" y="62" width="11" height="15" fill="#c3ccd2" opacity="0.75" />

      {/* Painted bay lines, converging toward the ramp. */}
      <g stroke="#6e7d86" strokeWidth="2.4" opacity="0.55">
        <path d="M22 180L64 134" />
        <path d="M96 180L112 134" />
      </g>
      <g stroke="#3d474e" strokeWidth="2.4" opacity="0.55">
        <path d="M176 180L160 134" />
        <path d="M236 176L206 134" />
      </g>

      {/* A sedan, three-quarters on, nothing of its own lit. */}
      <g>
        <path
          d="M104 128h58l14 -22h-31l-9 -14h-22l-6 14h-12z"
          fill="#1b2228"
          stroke="#8c9ba7"
          strokeWidth="1.5"
        />
        {/* Glass, holding the one strip light. */}
        <path d="M122 106h17l6 12h-25z" fill="#55656f" opacity="0.95" />
        <path d="M146 106h13l7 12h-14z" fill="#44525b" opacity="0.9" />
        {/* The flash coming back off the near wing. */}
        <path d="M104 128h22l4 -12h-14z" fill="#3e4a53" opacity="0.85" />
        <circle cx="117" cy="129" r="7" fill="#0d1013" />
        <circle cx="163" cy="129" r="7" fill="#0d1013" />
        <rect x="167" y="112" width="8" height="4" fill="#9aa7b0" opacity="0.7" />
      </g>

      {/* A second car, further in, only its shape. */}
      <rect x="196" y="110" width="40" height="18" rx="4" fill="#1c2329" />
    </g>
  )
}

/** A room lit by one lamp, shot without flash. Nothing in it resolves, which is the point. */
function InteriorNight() {
  return (
    <g>
      <rect width="240" height="180" fill="#11151a" />
      {/* A window, and the street doing nothing. */}
      <rect x="150" y="18" width="70" height="98" fill="#1b2126" />
      <rect x="157" y="25" width="56" height="42" fill="#232a30" />
      <rect x="157" y="72" width="56" height="38" fill="#1e2429" />
      <rect x="183" y="18" width="3" height="98" fill="#2a3138" />
      {/* The lamp, and the only three feet of the room it reaches. */}
      <circle cx="66" cy="66" r="38" fill="#3a3325" opacity="0.8" />
      <circle cx="66" cy="66" r="18" fill="#6b5c34" opacity="0.9" />
      <rect x="58" y="84" width="16" height="62" fill="#20262b" />
      <rect x="46" y="140" width="40" height="8" fill="#252c31" />
      {/* Floor. */}
      <rect y="148" width="240" height="32" fill="#0d1114" />
      <rect y="146" width="240" height="3" fill="#161b20" />
    </g>
  )
}

/** A printed page held flat under a desk lamp. Photographed, not scanned, and too small to read. */
function ScannedPage() {
  return (
    <g>
      <rect width="240" height="180" fill="#3a3a36" />
      {/* Desk. */}
      <rect y="16" width="240" height="164" fill="#5b5245" />
      <g transform="rotate(-2.4 120 96)">
        <rect x="34" y="14" width="172" height="164" fill="#0d0d0c" opacity="0.35" />
        <rect
          x="30"
          y="10"
          width="172"
          height="164"
          fill="#f4f2ec"
          stroke="#a8a8a0"
          strokeWidth="1"
        />
        <g fill="#b7b5ac">
          <rect x="48" y="30" width="86" height="6" />
          <rect x="48" y="48" width="136" height="3" />
          <rect x="48" y="57" width="136" height="3" />
          <rect x="48" y="66" width="122" height="3" />
          <rect x="48" y="80" width="136" height="3" />
          <rect x="48" y="89" width="136" height="3" />
          <rect x="48" y="98" width="70" height="3" />
          <rect x="48" y="118" width="136" height="3" />
          <rect x="48" y="127" width="104" height="3" />
          <rect x="48" y="148" width="54" height="3" />
        </g>
      </g>
      {/* The lamp's hotspot, off centre, the way a hand-held frame always is. */}
      <ellipse cx="104" cy="74" rx="96" ry="74" fill="#ffffff" opacity="0.1" />
    </g>
  )
}

export type { PhotoSubject }

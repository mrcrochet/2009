/**
 * Dock glyphs. Hand-drawn 20×20 line art matching the handoff — never emoji, never a generic
 * icon-library import.
 */
import type { ReactElement } from 'react'
import type { DockId } from '@/engine/types'

const GLYPHS: Record<string, ReactElement> = {
  mail: (
    <g>
      <rect x="2.5" y="5.5" width="15" height="9.5" rx="1.4" />
      <path d="M2.8 6.4l7.2 5.2 7.2-5.2" />
    </g>
  ),
  msg: (
    <g>
      <path d="M3 5.5h14v7.6h-6.6l-3.9 2.9v-2.9H3z" />
      <path d="M6.4 9.3h7.2" opacity=".65" />
    </g>
  ),
  web: (
    <g>
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14" />
      <path d="M10 3c2.6 2.7 2.6 11.3 0 14M10 3c-2.6 2.7-2.6 11.3 0 14" />
    </g>
  ),
  files: (
    <g>
      <path d="M2.5 6.2h5.2l1.6 2.1h8.2v8.2h-15z" />
      <path d="M2.5 10.4h15" opacity=".55" />
    </g>
  ),
  devices: (
    <g>
      <rect x="2.4" y="4.6" width="10.4" height="8.2" rx="1.2" />
      <path d="M1.6 15.4h12" />
      <rect x="14.2" y="7.4" width="4" height="8" rx="1" />
      <path d="M15.6 9h1.2" opacity=".7" />
    </g>
  ),
  notes: (
    <g>
      <rect x="4.2" y="3" width="11.6" height="14" rx="1.4" />
      <path d="M7 7.2h6M7 10.2h6M7 13.2h3.6" />
    </g>
  ),
  term: (
    <g>
      <rect x="2.5" y="4.2" width="15" height="11.6" rx="1.4" />
      <path d="M5.6 8.4l2.1 1.9-2.1 1.9M10 12.6h4.6" />
    </g>
  ),
  directory: (
    <g>
      <rect x="3.5" y="3" width="13" height="14" rx="1.4" />
      <path d="M6.4 7h7.2M6.4 10h7.2M6.4 13h4.4" opacity=".7" />
      <path d="M3.5 6.2h-1.4M3.5 10h-1.4M3.5 13.8h-1.4" />
    </g>
  ),
  phone: (
    <g>
      <rect x="6" y="3.2" width="8" height="13.6" rx="1.3" />
      <path d="M8.2 5.6h3.6M8.2 14.4h3.6" opacity=".7" />
    </g>
  ),
}

/** Icon face tints, straight from the handoff's TINT map. */
export const DOCK_TINT: Record<string, readonly [string, string]> = {
  mail: ['#6f9ec9', '#2f5d87'],
  msg: ['#7cb98a', '#2f6a44'],
  web: ['#69a8c9', '#2b5f80'],
  files: ['#d9b96a', '#8a6a28'],
  devices: ['#a3adb8', '#5a6570'],
  notes: ['#d6c77e', '#8a7a34'],
  term: ['#5c666f', '#23292e'],
  directory: ['#8fa4b8', '#4d6076'],
  phone: ['#8a97a4', '#4a545e'],
}

export function DockGlyph({ id }: { id: DockId }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[id] ?? GLYPHS.files}
    </svg>
  )
}

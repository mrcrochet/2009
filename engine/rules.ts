import type { CaseContent } from './case-schema'
import type { BeatId, Claim, ClaimVerdictKind, Viewport } from './types'

/**
 * Deterministic rules. Everything here is a pure function of authored content plus the numbers
 * already in the investigation.
 */

// --- Windows ---------------------------------------------------------------

const MENU_BAR_HEIGHT = 23
const DOCK_RESERVE = 90
const EDGE = 20

export function cascadePosition(
  index: number,
  width: number,
  height: number,
  viewport: Viewport,
): { x: number; y: number } {
  const x = Math.min(150 + index * 34, Math.max(EDGE, viewport.width - width - 40))
  const y = Math.min(
    70 + index * 28,
    Math.max(MENU_BAR_HEIGHT + EDGE, viewport.height - height - DOCK_RESERVE),
  )
  return { x: Math.round(x), y: Math.round(y) }
}

/** Keep at least a grabbable strip of titlebar on screen, always below the menu bar. */
export function clampWindow(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: Viewport,
): { x: number; y: number } {
  const minX = -(width - 120)
  const maxX = viewport.width - 120
  const minY = MENU_BAR_HEIGHT
  const maxY = Math.max(MENU_BAR_HEIGHT, viewport.height - 40)
  return {
    x: Math.round(Math.min(Math.max(x, minX), maxX)),
    y: Math.round(Math.min(Math.max(y, minY), maxY)),
  }
}

export function clampPhone(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: Math.round(Math.min(Math.max(x, -(width - 90)), viewport.width - 90)),
    y: Math.round(
      Math.min(Math.max(y, MENU_BAR_HEIGHT), Math.max(MENU_BAR_HEIGHT, viewport.height - 60)),
    ),
  }
}

export function defaultPhonePosition(viewport: Viewport): { x: number; y: number } {
  return { x: Math.max(EDGE, viewport.width - 330), y: 70 }
}

// --- Claims ----------------------------------------------------------------

export interface ClaimOutcome {
  readonly verdict: ClaimVerdictKind
  readonly message: string
  /** Filed under the investigator's name — a permanent consequence. */
  readonly onRecord: boolean
}

/**
 * A claim needs its exact evidence set: nothing missing, nothing extra. Unsound claims are
 * always refused, and refusal puts the claim on the record regardless.
 */
export function evaluateClaim(claim: Claim, selectedEvidenceIds: readonly string[]): ClaimOutcome {
  const selected = new Set(selectedEvidenceIds)
  const complete = claim.need.every((id) => selected.has(id)) && selected.size === claim.need.length

  if (!claim.sound) {
    return {
      verdict: 'refused',
      message: complete ? claim.accepted : claim.rejected,
      onRecord: true,
    }
  }
  if (!complete) {
    return { verdict: 'insufficient', message: claim.rejected, onRecord: false }
  }
  return { verdict: 'accepted', message: claim.accepted, onRecord: false }
}

// --- The report gate -------------------------------------------------------

export function canFileReport(
  beats: Readonly<Record<string, boolean>>,
  required: readonly BeatId[],
): boolean {
  return required.every((b) => beats[b] === true)
}

export function outstandingBeats(
  beats: Readonly<Record<string, boolean>>,
  required: readonly BeatId[],
): readonly BeatId[] {
  return required.filter((b) => beats[b] !== true)
}

// --- Search ----------------------------------------------------------------

export function searchIndex(content: CaseContent, rawQuery: string): readonly string[] {
  const q = rawQuery.toLowerCase().trim()
  if (!q) return []
  return content.browser.index
    .filter((entry) =>
      entry.keys.some((key) => {
        const k = key.toLowerCase()
        return q.includes(k) || (k.includes(q) && q.length > 3)
      }),
    )
    .map((entry) => entry.id)
}

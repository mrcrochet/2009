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

/**
 * Where a window opens.
 *
 * The first one is centred on the usable area rather than dropped at a fixed 150/70, and the
 * rest fan down and right from it. The fixed origin came from a handoff drawn at one size: on a
 * 1440-wide screen it piled every window into the top-left two thirds and left the bottom of the
 * desktop empty, which is not what a workstation looks like when somebody is working.
 *
 * The stack still walks a constant step, because a cascade the player can predict is the whole
 * value of a cascade — and it still clamps, so a narrow screen behaves exactly as before.
 */
export function cascadePosition(
  index: number,
  width: number,
  height: number,
  viewport: Viewport,
): { x: number; y: number } {
  const usableTop = MENU_BAR_HEIGHT + EDGE
  const usableHeight = viewport.height - usableTop - DOCK_RESERVE

  // Biased above centre: a window sitting at the true middle reads as low, because the dock
  // occupies the bottom and the eye counts it as floor.
  const originX = Math.max(EDGE, Math.round((viewport.width - width) / 2) - 60)
  const originY = Math.max(usableTop, usableTop + Math.round((usableHeight - height) * 0.38))

  const x = Math.min(originX + index * 34, Math.max(EDGE, viewport.width - width - 40))
  const y = Math.min(
    originY + index * 28,
    Math.max(usableTop, viewport.height - height - DOCK_RESERVE),
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

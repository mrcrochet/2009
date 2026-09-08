import type { DayContent } from './content-schema'
import type { Mystery, UnlockCondition } from './mystery-schema'
import type { TimelineState } from './types'
import { qualifyEvidenceId } from './types'

/**
 * Whether a mystery has opened, and what looking at it costs.
 *
 * Pure, like the rest of the engine: a mystery opens because of state the player produced, never
 * because a script decided it was time. The narrative meaning of any of this lives in
 * `content/`; what is here is only the arithmetic.
 */

export interface UnlockContext {
  readonly state: TimelineState
  /** Mysteries the community has finished, for `globalUnlock`. Empty when playing offline. */
  readonly globallyUnlocked: ReadonlySet<string>
}

function meets(condition: UnlockCondition, ctx: UnlockContext): boolean {
  const s = ctx.state
  switch (condition.kind) {
    case 'flag':
      return s.flags[condition.flag] === true
    case 'evidence':
      return s.evidence.some((e) => e.id === qualifyEvidenceId(s.day, condition.evidenceId))
    case 'beat':
      return s.beats[condition.beat] === true
    case 'visitedUrl':
      return (
        s.browser.url === condition.url || s.browser.history.some((h) => h.url === condition.url)
      )
    case 'memoryIntegrityAtMost':
      return s.memoryIntegrity <= condition.value
    case 'temporalShiftAtLeast':
      return s.temporalShift >= condition.value
    case 'heatAtLeast':
      return s.heat >= condition.value
    case 'dayAtLeast':
      return s.day >= condition.value
    case 'globalUnlock':
      return ctx.globallyUnlocked.has(condition.mysteryId)
    default: {
      // An unknown condition never opens anything. A mystery that fails closed is a mystery.
      assertNever(condition)
      return false
    }
  }
}

export function isUnlocked(mystery: Mystery, ctx: UnlockContext): boolean {
  const { all, any } = mystery.unlock
  if (!all.every((c) => meets(c, ctx))) return false
  if (any.length > 0 && !any.some((c) => meets(c, ctx))) return false
  return true
}

/** What the player still has to do. Used for authoring and debugging, never shown as a quest log. */
export function unmetConditions(mystery: Mystery, ctx: UnlockContext): readonly UnlockCondition[] {
  const missingAll = mystery.unlock.all.filter((c) => !meets(c, ctx))
  const anySatisfied =
    mystery.unlock.any.length === 0 || mystery.unlock.any.some((c) => meets(c, ctx))
  return anySatisfied ? missingAll : [...missingAll, ...mystery.unlock.any]
}

export function unlockedMysteries(
  mysteries: readonly Mystery[],
  ctx: UnlockContext,
): readonly Mystery[] {
  return mysteries.filter((m) => isUnlocked(m, ctx))
}

/**
 * Signal is a narrative budget, not a network quota. It is spent on looking into 2026 and it
 * does not come back within a day — which is what makes a player choose what they most need to
 * know rather than looking up everything.
 *
 * How much of it a day has is the day's decision, like its waking hours and the cost of a
 * memory. A day with no `wayup` block has none, and the console is not on that machine.
 */
export function signalBudget(content: DayContent): number {
  return content.wayup?.signalBudget ?? 0
}

export function signalSpent(state: TimelineState): number {
  return state.wayup.signalSpent
}

export function signalRemaining(state: TimelineState, content: DayContent): number {
  return Math.max(0, signalBudget(content) - state.wayup.signalSpent)
}

export function canAfford(state: TimelineState, content: DayContent, cost: number): boolean {
  return signalRemaining(state, content) >= cost
}

function assertNever(_condition: never): void {
  /* the type checker does the work; this exists so the runtime does not */
}

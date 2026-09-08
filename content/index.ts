import { DayContentSchema, type DayContent } from '@/engine/content-schema'
import { day01 as day01Raw } from './day01'

/**
 * Content is validated once, at module load. A malformed content module fails the build rather
 * than a player's session.
 */
export const DAY_01: DayContent = DayContentSchema.parse(day01Raw)

/** Every authored day. The invariant suite iterates this, so a new day is validated the moment
 * it is registered rather than shipping on Zod alone. */
export const BY_DAY: Readonly<Record<number, DayContent>> = { 1: DAY_01 }

export function contentForDay(day: number): DayContent {
  const found = BY_DAY[day]
  if (!found) throw new Error(`content: no authored content for day ${day}`)
  return found
}

export function hasContentForDay(day: number): boolean {
  return day in BY_DAY
}

/**
 * Everything `DAY_ADVANCED` needs about the day being entered, carried on the event so a replay
 * does not have to reach for another day's content mid-log.
 */
export function advanceEventFor(day: number) {
  const next = contentForDay(day)
  return {
    type: 'DAY_ADVANCED' as const,
    day: next.day,
    dateISO: next.dateISO,
    wakeMinute: next.wakeMinute,
    threadIds: next.threads.map((t) => t.id),
    firstMailId: next.mail[0]?.id ?? '',
    firstFileId: next.files[0]?.id ?? '',
    browserHome: next.browser.home,
    terminalBanner: next.terminal.banner,
  }
}

export const MAX_AUTHORED_DAY = Math.max(...Object.keys(BY_DAY).map(Number))

import { DayContentSchema, type DayContent } from '@/engine/content-schema'
import { day01 as day01Raw } from './day01'

/**
 * Content is validated once, at module load. A malformed content module fails the build rather
 * than a player's session.
 */
export const DAY_01: DayContent = DayContentSchema.parse(day01Raw)

const BY_DAY: Readonly<Record<number, DayContent>> = { 1: DAY_01 }

export function contentForDay(day: number): DayContent {
  const found = BY_DAY[day]
  if (!found) throw new Error(`content: no authored content for day ${day}`)
  return found
}

export function hasContentForDay(day: number): boolean {
  return day in BY_DAY
}

export const MAX_AUTHORED_DAY = Math.max(...Object.keys(BY_DAY).map(Number))

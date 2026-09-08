import { DayContentSchema, type DayContent } from '@/engine/content-schema'
import { buildWorldIndex, worldAsOf, type WorldIndex } from '@/engine/world'
import type { World } from '@/engine/world/schema'
import { projectDay } from '@/engine/world/project'
import { day01 as day01Raw } from './day01'
import { WORLD } from './world'

/**
 * Names the projection looks for in an artifact's text, and the entity each resolves to.
 *
 * Authored here rather than inferred, because a substring match on a short name finds the wrong
 * person, and the corpus is the thing that knows its own cast.
 */
const ENTITY_BY_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  WORLD.entities.flatMap((entity) =>
    [entity.canonicalName, ...entity.aliases]
      // Two characters is a coincidence, not a mention.
      .filter((name) => name.length >= 4)
      .map((name) => [name, entity.id] as const),
  ),
)

const PROJECTION_NAMES: readonly string[] = Object.keys(ENTITY_BY_NAME)

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

/**
 * The world the player can search: the authored corpus, plus every day projected into the same
 * graph.
 *
 * The projection is what stops there being two worlds — a graph nobody's story happens in, and a
 * story the graph has never heard of. A player who searches "Marc" reaches the mail they actually
 * read on the 15th, not a second Marc who exists only in a corpus file.
 */
export const GAME_WORLD: World = {
  ...WORLD,
  artifacts: [
    ...WORLD.artifacts,
    ...Object.values(BY_DAY).flatMap((day) =>
      projectDay(day, { resolve: (name) => ENTITY_BY_NAME[name] ?? null, names: PROJECTION_NAMES }),
    ),
  ],
}

/**
 * The world index for a given day, built once per day and kept.
 *
 * Cut to the day's own date, because every authored day is projected into one graph and a
 * machine on the fifteenth has no business answering questions about the twentieth.
 */
const INDEX_BY_DAY = new Map<number, WorldIndex>()

export function worldIndexForDay(day: number): WorldIndex {
  const cached = INDEX_BY_DAY.get(day)
  if (cached) return cached
  const built = buildWorldIndex(worldAsOf(GAME_WORLD, contentForDay(day).dateISO))
  INDEX_BY_DAY.set(day, built)
  return built
}

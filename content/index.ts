import { CaseContentSchema, type CaseContent } from '@/engine/case-schema'
import { buildWorldIndex, worldAsOf, type WorldIndex } from '@/engine/world'
import type { World } from '@/engine/world/schema'
import { projectCase } from '@/engine/world/project'
import { case001 as case001Raw } from './cases/case001'
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
export const CASE_001: CaseContent = CaseContentSchema.parse(case001Raw)

/** Every authored case. The invariant suite iterates this, so a new case is validated the moment
 * it is registered rather than shipping on Zod alone. */
export const BY_CASE: Readonly<Record<string, CaseContent>> = { [CASE_001.id]: CASE_001 }

export const DEFAULT_CASE_ID = CASE_001.id

export function contentForCase(caseId: string): CaseContent {
  const found = BY_CASE[caseId]
  if (!found) throw new Error(`content: no authored case "${caseId}"`)
  return found
}

export function hasContentForCase(caseId: string): boolean {
  return caseId in BY_CASE
}

/**
 * The world the investigator can search: the authored corpus, plus every case projected into the
 * same graph.
 *
 * The projection is what stops there being two worlds — a graph nobody's story happens in, and a
 * story the graph has never heard of. Someone who searches a name reaches the mail they actually
 * read, not a second person who exists only in a corpus file.
 */
export const GAME_WORLD: World = {
  ...WORLD,
  artifacts: [
    ...WORLD.artifacts,
    ...Object.values(BY_CASE).flatMap((kase) =>
      projectCase(kase, {
        resolve: (name) => ENTITY_BY_NAME[name] ?? null,
        names: PROJECTION_NAMES,
      }),
    ),
  ],
}

/**
 * The world index for a case, built once and kept.
 *
 * Cut to the case's own date, because a workstation working the seventeenth has no business
 * answering questions about the twentieth.
 */
const INDEX_BY_CASE = new Map<string, WorldIndex>()

export function worldIndexForCase(caseId: string): WorldIndex {
  const cached = INDEX_BY_CASE.get(caseId)
  if (cached) return cached
  const built = buildWorldIndex(worldAsOf(GAME_WORLD, contentForCase(caseId).dateISO))
  INDEX_BY_CASE.set(caseId, built)
  return built
}

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

// ---------------------------------------------------------------------------
// The shelf
// ---------------------------------------------------------------------------

/**
 * One case, as the library shows it.
 *
 * Derived from the registry rather than authored a second time, which is the whole point: a case
 * cannot appear in the library unless it is written, and a written case cannot be misdescribed
 * there, because the description is the case's own.
 */
export interface ShelfCase {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly hook: string
  readonly kind: string
  readonly art: CaseContent['catalogue']['art']
  readonly difficulty: string
  readonly estimate: string
  readonly surfaces: readonly string[]
  readonly provided: string
  readonly access: 'free' | 'members'
  readonly summary: string
  readonly series: CaseContent['catalogue']['series']
  readonly client: string
  readonly location: string
}

function shelfCase(kase: CaseContent): ShelfCase {
  return {
    id: kase.id,
    number: kase.number,
    title: kase.title,
    hook: kase.catalogue.hook,
    kind: kase.catalogue.kind,
    art: kase.catalogue.art,
    difficulty: kase.catalogue.difficulty,
    estimate: kase.catalogue.estimate,
    surfaces: kase.catalogue.surfaces,
    provided: kase.catalogue.provided,
    access: kase.catalogue.access,
    summary: kase.summary,
    series: kase.catalogue.series,
    client: kase.client,
    location: kase.location,
  }
}

/** Every case there is, lowest number first. */
export const SHELF: readonly ShelfCase[] = Object.values(BY_CASE)
  .map(shelfCase)
  .sort((a, b) => a.number - b.number)

export function shelfCaseById(caseId: string): ShelfCase | null {
  return SHELF.find((c) => c.id === caseId) ?? null
}

/**
 * Series with more than one case written.
 *
 * A season of five with four of them unwritten is a shelf making a promise it cannot keep, so a
 * series with one case is simply a case.
 */
export function shelfSeries(): readonly { name: string; cases: readonly ShelfCase[] }[] {
  const byName = new Map<string, ShelfCase[]>()
  for (const entry of SHELF) {
    if (!entry.series) continue
    const list = byName.get(entry.series.name) ?? []
    list.push(entry)
    byName.set(entry.series.name, list)
  }
  return [...byName.entries()]
    .filter(([, cases]) => cases.length > 1)
    .map(([name, cases]) => ({
      name,
      cases: [...cases].sort((a, b) => (a.series!.position ?? 0) - (b.series!.position ?? 0)),
    }))
}

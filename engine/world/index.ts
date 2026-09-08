import type { World, WorldArtifact, WorldEntity, WorldFact, WorldRelation } from './schema'

/**
 * The world, indexed for the two things a player actually does: search it, and open a person.
 *
 * Built once from authored content. Pure, so a component can hold it and a test can assert on it.
 */

export interface WorldIndex {
  readonly world: World
  readonly entityById: ReadonlyMap<string, WorldEntity>
  readonly artifactById: ReadonlyMap<string, WorldArtifact>
  /** Every artifact mentioning an entity, in date order. */
  readonly artifactsByEntity: ReadonlyMap<string, readonly WorldArtifact[]>
  readonly relationsByEntity: ReadonlyMap<string, readonly WorldRelation[]>
  readonly artifactsByFact: ReadonlyMap<string, readonly WorldArtifact[]>
  /**
   * Both directions of `contradicts`. An author declares "this receipt disagrees with that
   * photograph" once; the player can be holding either one first.
   */
  readonly contradictedBy: ReadonlyMap<string, ReadonlySet<string>>
  /** Lowercased alias → entity id. What lets "saabman81" reach a person. */
  readonly aliasIndex: ReadonlyMap<string, string>
}

function push<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

export function buildWorldIndex(world: World): WorldIndex {
  const entityById = new Map(world.entities.map((e) => [e.id, e]))
  const artifactById = new Map(world.artifacts.map((a) => [a.id, a]))

  const artifactsByEntity = new Map<string, WorldArtifact[]>()
  const artifactsByFact = new Map<string, WorldArtifact[]>()
  const relationsByEntity = new Map<string, WorldRelation[]>()
  const aliasIndex = new Map<string, string>()

  const byDate = [...world.artifacts].sort((a, b) => a.date.localeCompare(b.date))
  for (const artifact of byDate) {
    for (const entityId of new Set([...artifact.mentions, artifact.ownerEntityId ?? ''])) {
      if (entityId) push(artifactsByEntity, entityId, artifact)
    }
    if (artifact.factId) push(artifactsByFact, artifact.factId, artifact)
  }

  const contradictedBy = new Map<string, Set<string>>()
  const disagree = (a: string, b: string) => {
    const set = contradictedBy.get(a)
    if (set) set.add(b)
    else contradictedBy.set(a, new Set([b]))
  }
  for (const artifact of world.artifacts) {
    for (const other of artifact.contradicts) {
      disagree(artifact.id, other)
      disagree(other, artifact.id)
    }
  }

  for (const relation of world.relations) {
    push(relationsByEntity, relation.from, relation)
    push(relationsByEntity, relation.to, relation)
  }

  for (const entity of world.entities) {
    for (const alias of [entity.canonicalName, ...entity.aliases]) {
      aliasIndex.set(alias.toLowerCase(), entity.id)
    }
  }

  return {
    world,
    entityById,
    artifactById,
    artifactsByEntity,
    relationsByEntity,
    artifactsByFact,
    contradictedBy,
    aliasIndex,
  }
}

// --------------------------------------------------------------------- search

export interface SearchHit {
  readonly kind: 'entity' | 'artifact'
  readonly id: string
  readonly title: string
  readonly detail: string
  readonly surface: WorldArtifact['surface'] | 'people'
  /** Higher is better. Exactness beats length beats recency. */
  readonly score: number
}

export interface SearchResults {
  readonly query: string
  readonly total: number
  /** Counts per surface, which is the shape the palette shows before anything is opened. */
  readonly bySurface: Readonly<Record<string, number>>
  readonly hits: readonly SearchHit[]
}

export interface SearchOptions {
  /** Only artifacts the timeline has actually encountered. */
  readonly discovered?: ReadonlySet<string>
  readonly surfaces?: readonly WorldArtifact['surface'][]
  readonly limit?: number
}

function scoreText(haystack: string, needle: string): number {
  const h = haystack.toLowerCase()
  if (h === needle) return 100
  if (h.startsWith(needle)) return 60
  const at = h.indexOf(needle)
  if (at === -1) return 0
  // A hit early in a title means more than one buried in a paragraph.
  return Math.max(10, 40 - Math.floor(at / 20))
}

/**
 * One search across every surface.
 *
 * The point is not relevance ranking; it is that a player who wonders something can ask, and be
 * answered from the mail, the photos, the ledger and the web at once. A search that returns
 * "3 people, 27 emails, 4 photos, 19 forum posts" is a world. A search that returns a quest
 * marker is a menu.
 */
export function searchWorld(
  index: WorldIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchResults {
  const query = rawQuery.trim().toLowerCase()
  if (query.length < 2) {
    return { query: rawQuery, total: 0, bySurface: {}, hits: [] }
  }

  const hits: SearchHit[] = []

  for (const entity of index.world.entities) {
    // A name always matches, so without this a discovered-only search would surface a person the
    // player has never met — the most spoiling leak the search can produce. Somebody is known
    // once at least one thing mentioning them has been found.
    if (options.discovered && !isEntityKnown(index, entity.id, options.discovered)) continue

    const score = Math.max(
      scoreText(entity.canonicalName, query),
      ...entity.aliases.map((a) => scoreText(a, query)),
      0,
    )
    if (score > 0) {
      hits.push({
        kind: 'entity',
        id: entity.id,
        title: entity.canonicalName,
        detail: entity.type,
        surface: 'people',
        // An entity is what the player usually meant, so it outranks a mention of it.
        score: score + 20,
      })
    }
  }

  for (const artifact of index.world.artifacts) {
    if (options.discovered && !options.discovered.has(artifact.id)) continue
    if (options.surfaces && !options.surfaces.includes(artifact.surface)) continue

    const fieldText = Object.values(artifact.fields).join(' ')
    const score = Math.max(
      scoreText(artifact.title, query),
      scoreText(artifact.source, query),
      scoreText(fieldText, query),
      // Body matches are the weakest signal and the most common, so they are capped.
      Math.min(20, scoreText(artifact.body, query)),
    )
    if (score > 0) {
      hits.push({
        kind: 'artifact',
        id: artifact.id,
        title: artifact.title || artifact.source,
        detail: `${displayDate(artifact.date)} · ${artifact.source}`,
        surface: artifact.surface,
        score,
      })
    }
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  const bySurface: Record<string, number> = {}
  for (const hit of hits) bySurface[hit.surface] = (bySurface[hit.surface] ?? 0) + 1

  return {
    query: rawQuery,
    total: hits.length,
    bySurface,
    hits: hits.slice(0, options.limit ?? 60),
  }
}

/** Somebody exists for the player once one thing mentioning them has been found. */
export function isEntityKnown(
  index: WorldIndex,
  entityId: string,
  discovered: ReadonlySet<string>,
): boolean {
  const artifacts = index.artifactsByEntity.get(entityId) ?? []
  return artifacts.some((a) => discovered.has(a.id))
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/**
 * An ISO date as this machine writes one.
 *
 * Artifacts are stored ISO so they sort; a screen in 2009 never showed you `2008-11-30T23:40`.
 * The format matches the menu bar, so a date in a search result and the date in the corner of
 * the screen are recognisably the same kind of thing.
 */
export function displayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?$/.exec(iso)
  if (!match) return iso
  const [, year, month, day, time] = match
  const name = MONTHS[Number(month) - 1]
  if (!name) return iso
  const date = `${Number(day)} ${name} ${year}`
  return time ? `${date} · ${time}` : date
}

/** Everyone the player has met, for a directory that does not list strangers. */
export function knownEntities(
  index: WorldIndex,
  discovered: ReadonlySet<string>,
): readonly WorldEntity[] {
  return index.world.entities.filter((e) => isEntityKnown(index, e.id, discovered))
}

// -------------------------------------------------------------------- dossier

export interface EntityDossier {
  readonly entity: WorldEntity
  /** What the player has actually found, grouped by surface. */
  readonly known: Readonly<Record<string, readonly WorldArtifact[]>>
  readonly knownCount: number
  /**
   * How much exists that they have not found. Shown as a count, never as a list — the whole
   * value of the page is the shape of the gap.
   */
  readonly undiscoveredCount: number
  readonly relations: readonly { relation: WorldRelation; other: WorldEntity | null }[]
  /**
   * Pairs the player is holding that cannot both be true, where at least one is about this
   * person. The most useful contradiction in this game is between two documents nobody ever
   * filed under the same heading — an alibi and a parking stub — so this is not scoped to a fact.
   */
  readonly conflicts: readonly (readonly [WorldArtifact, WorldArtifact])[]
  readonly firstSeen: string | null
  readonly lastSeen: string | null
}

/**
 * Whether the player has anything that puts this connection within reach.
 *
 * Without this the entity page is a cheat sheet: open one file, and the machine lists the serial
 * number linking a handset to its previous owner under a heading that says "Documented. You have
 * seen where each of these comes from" — which would be a lie, and the most expensive kind, since
 * it hands over the chain the whole investigation is meant to be.
 *
 * The rule follows the grammar the page already uses. Something *documented* needs a document
 * the player holds that names both ends. Something *inferred* is the player's own work: they
 * need only have met both ends, which is exactly what working it out means. `sources` overrides
 * either, for the cases where an author knows better than a name match does.
 */
export function isRelationGrounded(
  index: WorldIndex,
  relation: WorldRelation,
  discovered: ReadonlySet<string>,
): boolean {
  if (relation.sources.length > 0) return relation.sources.some((id) => discovered.has(id))

  if (relation.confidence === 'inferred')
    return (
      isEntityKnown(index, relation.from, discovered) &&
      isEntityKnown(index, relation.to, discovered)
    )

  return (index.artifactsByEntity.get(relation.from) ?? []).some(
    (artifact) =>
      discovered.has(artifact.id) &&
      artifact.mentions.includes(relation.from) &&
      artifact.mentions.includes(relation.to),
  )
}

export function entityDossier(
  index: WorldIndex,
  entityId: string,
  discovered: ReadonlySet<string>,
): EntityDossier | null {
  const entity = index.entityById.get(entityId)
  if (!entity) return null

  const all = index.artifactsByEntity.get(entityId) ?? []
  const found = all.filter((a) => discovered.has(a.id))

  const known: Record<string, WorldArtifact[]> = {}
  for (const artifact of found) {
    const list = known[artifact.surface]
    if (list) list.push(artifact)
    else known[artifact.surface] = [artifact]
  }

  const relations = (index.relationsByEntity.get(entityId) ?? [])
    .filter((relation) => isRelationGrounded(index, relation, discovered))
    .map((relation) => ({
      relation,
      other: index.entityById.get(relation.from === entityId ? relation.to : relation.from) ?? null,
    }))

  const mine = new Set(found.map((a) => a.id))
  const conflicts = conflictingPairs(index, discovered).filter(
    ([a, b]) => mine.has(a.id) || mine.has(b.id),
  )

  return {
    entity,
    known,
    knownCount: found.length,
    undiscoveredCount: all.length - found.length,
    relations,
    conflicts,
    firstSeen: found[0]?.date ?? null,
    lastSeen: found[found.length - 1]?.date ?? null,
  }
}

/**
 * The traces of one fact that the player has found, and how many they have not.
 *
 * Two of six is usually enough to act on. The remaining four are why the world feels bigger than
 * the investigation.
 */
export interface FactCoverage {
  readonly found: number
  readonly total: number
  /**
   * How many pairs of what the player holds cannot both be true.
   *
   * Counting alone cannot tell 2-of-6 meaning "enough to act on" from 2-of-6 meaning "you are
   * holding a contradiction and have not noticed". Those are the two states this game is made
   * of, and they were the same number.
   */
  readonly conflicts: number
}

export function factCoverage(
  index: WorldIndex,
  factId: string,
  discovered: ReadonlySet<string>,
): FactCoverage {
  const traces = index.artifactsByFact.get(factId) ?? []
  const found = traces.filter((a) => discovered.has(a.id))

  let conflicts = 0
  for (let i = 0; i < found.length; i += 1) {
    for (let j = i + 1; j < found.length; j += 1) {
      const a = found[i]!
      const b = found[j]!
      if (index.contradictedBy.get(a.id)?.has(b.id)) conflicts += 1
    }
  }

  return { found: found.length, total: traces.length, conflicts }
}

/**
 * Everything the player holds that disagrees with something else they hold.
 *
 * Not scoped to a fact, because the most useful contradiction in this game is between two
 * documents that were never filed under the same heading — a parking stub and an alibi.
 */
export function conflictingPairs(
  index: WorldIndex,
  discovered: ReadonlySet<string>,
): readonly (readonly [WorldArtifact, WorldArtifact])[] {
  const pairs: [WorldArtifact, WorldArtifact][] = []
  for (const id of discovered) {
    const artifact = index.artifactById.get(id)
    if (!artifact) continue
    for (const otherId of index.contradictedBy.get(id) ?? []) {
      // Once per pair, and only when the player is holding both ends of it.
      if (otherId <= id || !discovered.has(otherId)) continue
      const other = index.artifactById.get(otherId)
      if (other) pairs.push([artifact, other])
    }
  }
  return pairs
}

export function resolveAlias(index: WorldIndex, text: string): WorldEntity | null {
  const id = index.aliasIndex.get(text.trim().toLowerCase())
  return id ? (index.entityById.get(id) ?? null) : null
}

export type { World, WorldArtifact, WorldEntity, WorldFact, WorldRelation }

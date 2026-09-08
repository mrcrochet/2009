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
        detail: `${artifact.date} · ${artifact.source}`,
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
  readonly firstSeen: string | null
  readonly lastSeen: string | null
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

  const relations = (index.relationsByEntity.get(entityId) ?? []).map((relation) => ({
    relation,
    other: index.entityById.get(relation.from === entityId ? relation.to : relation.from) ?? null,
  }))

  return {
    entity,
    known,
    knownCount: found.length,
    undiscoveredCount: all.length - found.length,
    relations,
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
export function factCoverage(
  index: WorldIndex,
  factId: string,
  discovered: ReadonlySet<string>,
): { readonly found: number; readonly total: number } {
  const traces = index.artifactsByFact.get(factId) ?? []
  return { found: traces.filter((a) => discovered.has(a.id)).length, total: traces.length }
}

export function resolveAlias(index: WorldIndex, text: string): WorldEntity | null {
  const id = index.aliasIndex.get(text.trim().toLowerCase())
  return id ? (index.entityById.get(id) ?? null) : null
}

export type { World, WorldArtifact, WorldEntity, WorldFact, WorldRelation }

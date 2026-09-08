import { WorldSchema, type World } from '@/engine/world/schema'
import { entities } from './entities'
import { facts } from './facts'
import { artifacts } from './artifacts'
import { relations } from './relations'

/**
 * The authored world, validated at module load.
 *
 * `content/index.ts` validates the per-day content and nothing else, so nothing would otherwise
 * check this corpus until a player opened a search box. Parsing here keeps the house rule: a
 * malformed content module fails the build rather than a player's session.
 */
export const WORLD: World = WorldSchema.parse({ entities, artifacts, relations, facts })

export { entities, facts, artifacts, relations }

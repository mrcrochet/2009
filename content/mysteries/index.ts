import { MysterySchema, type Mystery } from '@/engine/mystery-schema'
import { deadCity } from './dead-city'

/**
 * Every mystery, validated at module load.
 *
 * A mystery that names a real person, claims a historical basis it cannot cite, or reproduces
 * someone else's expression fails the build rather than a review. The reasoning is in
 * `docs/MYSTERY_AUTHORING.md`; what is enforced here is the part a document cannot enforce.
 */
export const MYSTERIES: readonly Mystery[] = [deadCity].map((m) => MysterySchema.parse(m))

export function mysteryById(id: string): Mystery | null {
  return MYSTERIES.find((m) => m.id === id) ?? null
}

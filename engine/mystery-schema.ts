import { z } from 'zod'

/**
 * The authoring contract for a mystery.
 *
 * This is the editorial framework made machine-checkable. The reasoning behind it — real
 * mysteries are a *grammar*, never a canon of conspiracy — is in `docs/MYSTERY_AUTHORING.md`.
 * What lives here is the half a document cannot enforce: a mystery that names a real person, or
 * claims a documentary basis it cannot cite, fails the build rather than a review someone was
 * too busy to do carefully.
 */

const id = z.string().min(1).max(64)

/**
 * How a mystery relates to something that actually happened.
 *
 * `original` invents everything. `historical` states a fact about the real world and must cite
 * where it can be checked. `fictionalized` borrows the *shape* of a real phenomenon — hidden
 * clues across several media, a broadcast with no sender — and rebuilds every name, document and
 * causality from scratch. There is deliberately no mode meaning "adapts a real unsolved case":
 * the cases with the best structure are exactly the ones entangled with real deaths, real
 * crimes and unproven accusations about real people.
 */
export const InspirationModeSchema = z.enum(['original', 'historical', 'fictionalized'])

/**
 * How far a piece of content depends on what the player has done.
 *
 * T0 static · T1 small variants · T2 conditioned on divergence · T3 depends on Way Up
 * observations or contradictions between them · T4 shared state across players.
 *
 * The higher the number the less a save can be replayed from its own log alone, which is a real
 * cost to weigh rather than a badge.
 */
export const TimelineDependencySchema = z.enum(['T0', 'T1', 'T2', 'T3', 'T4'])

/**
 * What looking costs, in signal rather than in requests.
 *
 * 0 is local 2009 content. 1–3 an archive or a single snapshot. 4–6 a search or a second hop
 * into 2026. 7–9 a source that is temporally unstable or deeply hidden. 10–12 is reserved for
 * the rare, world-level anomaly — and a day that spends 10 on something ordinary has spent the
 * word's meaning along with it.
 */
export const SignalCostSchema = z.number().int().min(0).max(12)

/**
 * The clearance a mystery has to publish.
 *
 * `realPersons` and `copiedAssets` are asserted false rather than merely absent, so an author
 * has to look at them. `sources` is required for anything claiming a historical basis: a fact
 * the player can check is worth more than one they must take on faith, and an unsourced
 * "historical" claim is just a rumour with better typography.
 */
export const MysteryLegalSchema = z
  .object({
    mode: InspirationModeSchema,
    /** No real person is named, described, quoted, or made identifiable. */
    realPersons: z.literal(false),
    /** No text, image, puzzle or layout is reproduced from an existing work. */
    copiedAssets: z.boolean(),
    /**
     * Where a `historical` claim can be verified. Public, primary where possible, and never a
     * forum post asserting a theory.
     */
    sources: z.array(z.string().url()).default([]),
    /** What real phenomenon lent its shape, named so a reviewer can judge the distance kept. */
    structuralInspiration: z.string().max(200).nullable().default(null),
    /**
     * Set only by a human who has read the whole mystery against the editorial rules. The suite
     * reports how many mysteries carry it; a growing number is a smell.
     */
    reviewed: z.boolean().default(false),
  })
  .superRefine((legal, ctx) => {
    if (legal.mode === 'historical' && legal.sources.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message:
          'a historical mystery must cite where its claim can be checked — an unsourced fact is a rumour',
        path: ['sources'],
      })
    }
    if (legal.mode === 'fictionalized' && !legal.structuralInspiration) {
      ctx.addIssue({
        code: 'custom',
        message:
          'name the phenomenon whose shape was borrowed, so a reviewer can judge the distance kept',
        path: ['structuralInspiration'],
      })
    }
    if (legal.copiedAssets) {
      ctx.addIssue({
        code: 'custom',
        message: 'nothing ships that reproduces someone else’s expression',
        path: ['copiedAssets'],
      })
    }
  })

/** A single condition. Deliberately small: a mystery opens on state, never on a script. */
export const UnlockConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('flag'), flag: z.string().min(1) }),
  z.object({ kind: z.literal('evidence'), evidenceId: id }),
  z.object({ kind: z.literal('beat'), beat: z.string().min(1) }),
  z.object({ kind: z.literal('visitedUrl'), url: z.string().min(1) }),
  z.object({ kind: z.literal('memoryIntegrityAtMost'), value: z.number().int().min(0).max(100) }),
  z.object({ kind: z.literal('temporalShiftAtLeast'), value: z.number().int().min(0) }),
  z.object({ kind: z.literal('heatAtLeast'), value: z.number().int().min(0) }),
  z.object({ kind: z.literal('dayAtLeast'), value: z.number().int().min(1) }),
  z.object({ kind: z.literal('globalUnlock'), mysteryId: id }),
])

export const UnlockSchema = z.object({
  /** Every one of these. */
  all: z.array(UnlockConditionSchema).default([]),
  /** At least one of these, when any are given. */
  any: z.array(UnlockConditionSchema).default([]),
})

/**
 * A mystery that several players solve together.
 *
 * `fragmentsRequired` is the whole design: no single timeline can hold them all, so the thing
 * only opens if people talk to each other outside the game.
 */
export const GlobalMysterySchema = z.object({
  fragmentsRequired: z.number().int().min(2).max(1000),
  /** What changes in the world when it completes. Authored, never "500 coins". */
  resolution: z.string().min(1),
})

export const MysterySchema = z.object({
  id,
  /** For authors and reviewers. Never shown to a player. */
  title: z.string().min(1).max(120),
  legal: MysteryLegalSchema,
  timelineDependency: TimelineDependencySchema,
  signalCost: SignalCostSchema,
  unlock: UnlockSchema,
  /** Flags this mystery sets when it opens, for other content to condition on. */
  setsFlags: z.array(z.string().min(1)).default([]),
  global: GlobalMysterySchema.nullable().default(null),
  /**
   * The beat a player is left holding. A local answer should not have to resolve the whole
   * thing — finishing an investigation and opening a larger question is the shape that keeps a
   * season alive.
   */
  leavesOpen: z.string().min(1),
})

export type Mystery = z.infer<typeof MysterySchema>
export type UnlockCondition = z.infer<typeof UnlockConditionSchema>
export type InspirationMode = z.infer<typeof InspirationModeSchema>

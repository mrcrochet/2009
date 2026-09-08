import { z } from 'zod'

/**
 * The world graph: everything that exists, independently of the day a player meets it.
 *
 * **This is content, not a database.** The instinct to put it in Postgres is understandable and
 * wrong for two reasons the repo has already paid for: Day 01 is playable with no account and no
 * network, and a world that lives in rows has no offline existence; and the engine is pure and
 * replayable, which a world that changes because someone updated a row is not. Supabase stores
 * what a *timeline* did with the world — what it visited, pinned, discovered — never the world.
 *
 * The days do not stop existing. They become events *in* this world rather than the only things
 * in it.
 */

const id = z.string().min(1).max(64)
const cents = z.number().int()

export const EntityTypeSchema = z.enum([
  'person',
  'organization',
  'place',
  'vehicle',
  'account',
  'handle',
  'domain',
  'device',
])

/**
 * A thing the world contains. `aliases` is what makes a search feel like a world rather than a
 * database: a player types "saabman81" and reaches a person.
 */
export const WorldEntitySchema = z.object({
  id,
  type: EntityTypeSchema,
  canonicalName: z.string().min(1).max(200),
  aliases: z.array(z.string().min(1).max(200)).default([]),
  /** Free-form, for the entity page. Keys are shown as written. */
  metadata: z.record(z.string().max(64), z.string().max(500)).default({}),
})

export const ArtifactTypeSchema = z.enum([
  'email',
  'sms',
  'call',
  'photo',
  'document',
  'transaction',
  'forumPost',
  'webPage',
  'classified',
  'record',
])

/**
 * One trace of one fact.
 *
 * The design rule this whole file exists to serve: **one fact, many surfaces.** Marc owning a
 * black Saab should be discoverable from an email, a photograph, a classified ad, a bank line, a
 * forum handle and a partial plate on a record — and the player needs only two or three of them.
 * Nobody has to find all six. The world feels large because they exist.
 */
export const WorldArtifactSchema = z.object({
  id,
  type: ArtifactTypeSchema,
  /**
   * ISO date, or a date-time when the hour matters — which for an alibi it usually does.
   *
   * The shape is enforced because artifacts are ordered with `localeCompare`, and a single
   * `14/01/2009` among the ISO dates sorts to the wrong decade without anything failing. What
   * the player sees is never this string: `displayDate` renders it in the machine's own format.
   */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/, 'artifact dates are ISO: YYYY-MM-DD[THH:MM]'),
  title: z.string().max(300).default(''),
  body: z.string().max(8000).default(''),
  /** Where it lives, so a player can be told how to reach it. */
  source: z.string().min(1).max(200),
  /** Which surface of the OS shows it. */
  surface: z.enum(['mail', 'msg', 'web', 'files', 'bank', 'phone', 'term', 'archive']),
  /**
   * Where the player types to reach it, for the artifacts that have an address.
   *
   * Left null it is derived from `source` when the source is already URL-shaped, which most of
   * the web corpus is. Set it when the source reads as a place rather than an address — a forum
   * whose posts live at a thread number, a paper whose column has its own path.
   */
  url: z.string().max(300).nullable().default(null),
  ownerEntityId: id.nullable().default(null),
  /** Entities this artifact is evidence about. The edges of the graph. */
  mentions: z.array(id).default([]),
  /** Structured detail a player can actually inspect: EXIF, tower, plate, amount. */
  fields: z.record(z.string().max(64), z.string().max(500)).default({}),
  amountCents: cents.nullable().default(null),
  /**
   * Which authored fact this trace carries. Several artifacts sharing a `factId` are the same
   * truth seen from different angles — and the invariant suite checks that no fact is reachable
   * from only one place.
   */
  factId: id.nullable().default(null),
  /**
   * Whether this document tells the truth.
   *
   * The whole game is that one of them does not, and without this the graph holds a lie and its
   * refutation with identical authority. `mistaken` is sincerely wrong — a clock nobody reset, a
   * neighbour who is sure it was Tuesday. `deceptive` was written to be believed by someone who
   * would check.
   *
   * This is authoring metadata and never reaches a screen. A page that told the player which
   * document is the lie would be an answer key. What the player is shown is that two things they
   * hold cannot both be true.
   */
  reliability: z.enum(['reliable', 'mistaken', 'deceptive']).default('reliable'),
  /**
   * Artifacts this one cannot both be true with.
   *
   * Declared in one direction and read in both. This is what separates 2-of-6 meaning "you have
   * enough" from 2-of-6 meaning "you are holding a contradiction and have not noticed" — the
   * same number, and not remotely the same state.
   */
  contradicts: z.array(id).default([]),
  /**
   * The line of this document that is at issue, quoted.
   *
   * `contradicts` points at a whole document, and a document is rarely wholly false. The email
   * that says "stayed in all evening" also says "call me tomorrow, i have something that pays",
   * and the second is true and is the hook into the next day. This is what the machine puts on
   * screen when it sets two documents against each other — the clause, not the file name, so the
   * player sees the disagreement rather than being told there is one.
   *
   * It still never says which side is lying.
   */
  disputedClaim: z.string().max(300).nullable().default(null),
  /** Rewritten when the world moves. Same mechanism as a browser page's variants. */
  variants: z
    .array(
      z.object({
        whenFlag: z.string().min(1).nullable().default(null),
        minShift: z.number().int().min(0).default(0),
        title: z.string().max(300).nullable().default(null),
        body: z.string().max(8000).nullable().default(null),
      }),
    )
    .default([]),
})

export const RelationTypeSchema = z.enum([
  'knows',
  'employedBy',
  'owns',
  'registeredTo',
  'livesAt',
  'locatedAt',
  'foundedBy',
  'usesHandle',
  'relatedTo',
])

export const WorldRelationSchema = z.object({
  from: id,
  relation: RelationTypeSchema,
  to: id,
  validFrom: z.string().max(32).nullable().default(null),
  validUntil: z.string().max(32).nullable().default(null),
  /**
   * How sure the world is. `asserted` is a fact of the fiction; `inferred` is something the
   * player could work out; `rumoured` is somebody's claim and may be wrong. The entity page must
   * not present the third as the first.
   */
  confidence: z.enum(['asserted', 'inferred', 'rumoured']).default('asserted'),
  /**
   * The documents that put this within the player's reach, when no single artifact names both
   * ends of it — an anonymous post everybody knows is Marc, a rumour repeated in one thread.
   *
   * Left empty, a relation is grounded by the artifacts themselves: see `entityDossier`. It is
   * never grounded by nothing. A connection the player cannot trace back to something they hold
   * is the entity page telling them the answer, which is the one thing it must not do.
   */
  sources: z.array(id).default([]),
})

/**
 * A fact the world holds, and the reason a search feels like an investigation.
 *
 * Authored separately from its traces so the invariant suite can ask the only question that
 * matters here: is this discoverable from more than one place?
 */
export const WorldFactSchema = z.object({
  id,
  /** For authors. Never shown. */
  statement: z.string().min(1).max(300),
  about: z.array(id).min(1),
  /** How ordinary this is. The world is mostly ordinary, which is what makes the rest land. */
  register: z.enum(['ordinary', 'economic', 'sideStory', 'suggestive', 'anomalous']),
})

export const WorldSchema = z.object({
  entities: z.array(WorldEntitySchema),
  artifacts: z.array(WorldArtifactSchema),
  relations: z.array(WorldRelationSchema),
  facts: z.array(WorldFactSchema),
})

export type WorldEntity = z.infer<typeof WorldEntitySchema>
export type WorldArtifact = z.infer<typeof WorldArtifactSchema>
export type WorldRelation = z.infer<typeof WorldRelationSchema>
export type WorldFact = z.infer<typeof WorldFactSchema>
export type World = z.infer<typeof WorldSchema>
export type EntityType = z.infer<typeof EntityTypeSchema>
export type RelationType = z.infer<typeof RelationTypeSchema>
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>

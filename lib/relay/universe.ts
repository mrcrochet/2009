/**
 * The registry of what belongs to us.
 *
 * The relay shows the player the real web. A designed mechanic lets our fiction place an invented
 * result among the real ones — a page that exists only in this investigation. That is a good beat
 * in a game about whether documents are real, and it is also the most dangerous thing in the
 * product: done carelessly it fabricates statements about real people and real companies and
 * hands them to a player as something retrieved from the live internet.
 *
 * So an overlay may only ever concern an entity listed here. This file is the allowlist, and
 * `overlay.ts` is the thing that refuses anything else. Editorial care will not hold that line
 * across a case library and several authors; a failing test will.
 *
 * Note what is deliberately *absent*. A case's authored web may mention a real city, a real
 * transit agency or a real public records office, because the corpus is set in a real place and
 * saying so is not a claim about anybody. None of it may appear in an overlay, because an overlay
 * is us inventing a document and showing it to the player as if the network returned it.
 */

/** How much a name is ours, which decides how much invention it can carry. */
export type EntityProvenance =
  /** Coined for this game. No real-world referent; safe to invent freely about. */
  'invented'

export interface UniverseEntity {
  readonly id: string
  readonly provenance: EntityProvenance
  /** Every way the fiction refers to this thing. Used to mask our own names out of a text scan. */
  readonly aliases: readonly string[]
  /** Hosts this entity owns. An overlay must live on one of them. */
  readonly domains: readonly string[]
}

/**
 * Everything invented for UNLISTED. Aliases are matched case-insensitively and are what stops the
 * proper-noun scanner in `overlay.ts` from flagging our own vocabulary.
 */
export const UNIVERSE: readonly UniverseEntity[] = [
  {
    id: 'ridgeline',
    provenance: 'invented',
    aliases: ['Ridgeline Partners', 'Ridgeline Partners LLC', 'Ridgeline'],
    domains: ['ridgelinepartners.com'],
  },
  {
    id: 'marlow',
    provenance: 'invented',
    aliases: ['The Marlow Foundation', 'Marlow Foundation', 'Marlow'],
    domains: ['marlowfoundation.org'],
  },
  {
    id: 'fremont-parking',
    provenance: 'invented',
    aliases: ['Fremont Street Parking', 'Fremont Street', 'Fremont lot'],
    domains: ['fremontparking.com'],
  },
  {
    id: 'cascade-mobile',
    provenance: 'invented',
    aliases: ['Cascade Mobile', 'CASCADE MOBILE'],
    domains: ['cascademobile.com'],
  },
  {
    id: 'hollow-coast',
    provenance: 'invented',
    aliases: ['The Hollow Coast', 'Hollow Coast'],
    domains: [],
  },
  {
    id: 'nova',
    provenance: 'invented',
    // The workstation, its maker, and the vocabulary its own screens print. Registered so the
    // scanner does not flag the game's own chrome as a foreign proper noun.
    aliases: [
      'UNLISTED',
      'NOVA Systems',
      'NOVA',
      'NOVA M12',
      'the workstation',
      'Relay Mail',
      'Dispatch',
      'Orbit',
      'the relay',
    ],
    domains: ['nova-systems.com'],
  },
  {
    id: 'cast',
    provenance: 'invented',
    // The people of the fiction. Named here so a page about one of them is allowed, and so the
    // scanner does not mistake them for real people.
    aliases: [
      'Daniel James Mercer',
      'Daniel Mercer',
      'Claire Mercer',
      'Richard A. Vale',
      'Richard Vale',
      'Nadia Okafor',
      'Amara Whitfield',
      'Joel Reyes',
      'Alice Marlow',
      'Peter Brandt',
      'Sofia Ellery',
      'Marguerite Hoy',
      'Mercer',
      'Okafor',
      'Whitfield',
      'Vale',
      'Reyes',
    ],
    domains: [],
  },
]

const BY_ID = new Map(UNIVERSE.map((entity) => [entity.id, entity]))

export function findEntity(id: string): UniverseEntity | null {
  return BY_ID.get(id) ?? null
}

/** Every host the fiction owns, lowercased. An overlay must be addressed to one of these. */
export const OWNED_DOMAINS: ReadonlySet<string> = new Set(
  UNIVERSE.flatMap((entity) => entity.domains).map((domain) => domain.toLowerCase()),
)

/**
 * Every alias, longest first.
 *
 * Order matters: masking "Marlow" before "Marlow Foundation" would leave a stray " Foundation"
 * behind and the
 * proper-noun scanner would then have a fragment to complain about.
 */
export const ALL_ALIASES: readonly string[] = UNIVERSE.flatMap((entity) => entity.aliases).sort(
  (a, b) => b.length - a.length,
)

/**
 * Real-world names an author is most likely to reach for, because the authored content is
 * full of them.
 *
 * This is not a model of the real world and cannot be — it is a tripwire under the specific
 * mistake of copying a line out of `content/day01/` into an overlay. Matched case-insensitively
 * on a word boundary, so `REUTERS` and `Reuters` both trip it.
 */
/**
 * Real-world names an author is most likely to reach for, because the corpus is set in a real
 * city and is full of them.
 *
 * This is not a model of the real world and cannot be — it is a tripwire under the specific
 * mistake of copying a line out of `content/` into an overlay. Matched case-insensitively on a
 * word boundary, so `REUTERS` and `Reuters` both trip it.
 */
export const REAL_ENTITY_DENYLIST: readonly string[] = [
  // Real institutions the authored corpus stands next to, and therefore within copy-paste reach.
  'KGW',
  'TriMet',
  'Multnomah',
  'Portland General',
  'Portland Public Schools',
  'Doug Fir',
  'Secretary of State',
  'Department of Justice',
  // Common enough in tech and news writing to be worth naming.
  'Apple',
  'Amazon',
  'Google',
  'Microsoft',
  'Netflix',
  'Bitcoin',
  'Tesla',
  'Facebook',
  'Twitter',
  'YouTube',
  'Sony',
  'Dow Jones',
  'Nvidia',
  'OpenAI',
  'Anthropic',
  'Reuters',
  'Wikipedia',
  'Reddit',
  'Stripe',
  'Supabase',
  'Vercel',
  'Firecrawl',
  'Yahoo',
  'Craigslist',
  'eBay',
  'Meta',
  'Alphabet',
]

/**
 * The registry of what belongs to us.
 *
 * The Way Up Machine shows the player the real web. A designed mechanic lets our fiction place
 * an invented result among the real ones — a page that exists only in this timeline. That is a
 * good beat in a game about whether documents are real, and it is also the most dangerous thing
 * in the product: done carelessly it fabricates statements about real people and real companies
 * and hands them to a player as something retrieved from the live internet.
 *
 * So an overlay may only ever concern an entity listed here. This file is the allowlist, and
 * `overlay.ts` is the thing that refuses anything else. Editorial care will not hold that line
 * across thirty days and several authors; a failing test will.
 *
 * Note what is deliberately *absent*. The authored 2009 web mentions Apple, Amazon, Google,
 * Microsoft, Netflix, Bitcoin, Sony, the Dow, Portland and the metzdowd mailing list. All of
 * that is correct for the historical layer — the player is in 2009 and 2009 contained those
 * things. None of it may appear in an overlay, because an overlay is us inventing a document and
 * showing it to the player as if the network returned it.
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
 * Everything invented for 2009. Aliases are matched case-insensitively and are what stops the
 * proper-noun scanner in `overlay.ts` from flagging our own vocabulary.
 */
export const UNIVERSE: readonly UniverseEntity[] = [
  {
    id: 'aion',
    provenance: 'invented',
    aliases: ['Aion Group', 'Aion Group LLC', 'Aion', 'AION GROUP', 'Settlements'],
    domains: ['aion-group.com'],
  },
  {
    id: 'meridian',
    provenance: 'invented',
    aliases: [
      'Meridian Savings & Loan',
      'Meridian Savings and Loan',
      'Meridian Savings',
      'Meridian Wireless',
      'Meridian',
    ],
    domains: ['meridiansavings.com'],
  },
  {
    id: 'corvid',
    provenance: 'invented',
    aliases: ['Corvid Inc', 'Corvid Mail', 'Corvid Directory', 'Corvid'],
    domains: ['corvid.com'],
  },
  {
    id: 'cluster',
    provenance: 'invented',
    aliases: ['Cluster'],
    domains: ['cluster.com'],
  },
  {
    id: 'tradepost',
    provenance: 'invented',
    aliases: ['TradePost'],
    domains: ['tradepost.com'],
  },
  {
    id: 'namewell',
    provenance: 'invented',
    aliases: ['Namewell', 'NAMEWELL'],
    domains: ['namewell.com'],
  },
  {
    id: 'nullcache',
    provenance: 'invented',
    aliases: ['nullcache'],
    domains: ['nullcache.org'],
  },
  {
    id: 'columbia-register',
    provenance: 'invented',
    aliases: ['The Columbia Register', 'Columbia Register'],
    domains: ['columbia-register.com'],
  },
  {
    id: 'halcyon',
    provenance: 'invented',
    // The OS, and the vocabulary its own screens print. Registered so the scanner does not flag
    // the game's own chrome as a foreign proper noun.
    aliases: ['HALCYON', 'Halcyon', 'Halcyon Browser', 'Way Up Machine', 'Way Up'],
    domains: [],
  },
  {
    id: 'geohost',
    provenance: 'invented',
    aliases: ['GeoHost', 'Quiet Line', 'QUIET LINE'],
    domains: ['geohost.com'],
  },
  {
    id: 'ember',
    provenance: 'invented',
    aliases: ['Ember Messenger', 'Ember'],
    domains: [],
  },
  {
    id: 'nokora',
    provenance: 'invented',
    aliases: ['Nokora', 'NOKORA N90', 'Nokora N90'],
    domains: [],
  },
  {
    id: 'quoteline',
    provenance: 'invented',
    aliases: ['Quoteline', 'QUOTELINE'],
    domains: [],
  },
  {
    id: 'cast',
    provenance: 'invented',
    // The people of the fiction. Named here so a page about one of them is allowed, and so the
    // scanner does not mistake them for real people.
    aliases: ['Owen T. Rask', 'Owen Rask', 'Rask', 'Marc Deleon', 'Deleon', 'Lea Voss', 'Voss'],
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
 * Order matters: masking "Aion" before "Aion Group" would leave a stray " Group" behind and the
 * proper-noun scanner would then have a fragment to complain about.
 */
export const ALL_ALIASES: readonly string[] = UNIVERSE.flatMap((entity) => entity.aliases).sort(
  (a, b) => b.length - a.length,
)

/**
 * Real-world names an author is most likely to reach for, because the authored 2009 content is
 * full of them.
 *
 * This is not a model of the real world and cannot be — it is a tripwire under the specific
 * mistake of copying a line out of `content/day01/` into an overlay. Matched case-insensitively
 * on a word boundary, so `REUTERS` and `Reuters` both trip it.
 */
export const REAL_ENTITY_DENYLIST: readonly string[] = [
  // In the authored 2009 web, and therefore within copy-paste reach.
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
  'Obama',
  'Ace Hotel',
  'metzdowd',
  'FDIC',
  'Steelers',
  'Cardinals',
  // Common enough in tech writing to be worth naming.
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
  'GeoCities',
  'Craigslist',
  'eBay',
  'Meta',
  'Alphabet',
]

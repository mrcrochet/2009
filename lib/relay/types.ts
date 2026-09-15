/**
 * The Way Up Machine — the boundary between the game's deterministic 2009 and the real web of
 * today.
 *
 * Everything crossing this boundary becomes an immutable snapshot. The engine is event-sourced
 * and `tests/unit/replay.test.ts` proves a save reproduces exactly; the live web offers no such
 * guarantee, so a page observed inside a timeline is captured once and referenced by id from
 * then on. A later fetch of the same URL produces a *different* snapshot to compare against,
 * never a silent substitution.
 */

/** Why a URL or a response was refused. Stable strings — the UI and the tests both read them. */
export type RelayRefusal =
  | 'scheme'
  | 'credentials'
  | 'private-address'
  | 'metadata-endpoint'
  | 'own-origin'
  | 'redirect-loop'
  | 'too-many-redirects'
  | 'content-type'
  | 'too-large'
  | 'timeout'
  | 'unresolvable'
  | 'network'

export class RelayRefused extends Error {
  constructor(
    readonly refusal: RelayRefusal,
    message: string,
  ) {
    super(message)
    this.name = 'RelayRefused'
  }
}

/**
 * A block of remote content, already normalised. Deliberately not HTML: the client renders these
 * with HALCYON's own renderer, so no third-party markup is ever handed to the game's origin.
 */
export type RelayBlock =
  | { readonly kind: 'heading'; readonly text: string; readonly level: 1 | 2 | 3 }
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'quote'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'code'; readonly text: string }
  | { readonly kind: 'rule' }

export interface RelayLink {
  readonly label: string
  readonly url: string
}

/**
 * A page as it existed at one moment, from one timeline's point of view.
 *
 * `id` is derived from the canonical URL *and* the content hash, so capturing the same
 * unchanged page twice yields the same id, while a page that has changed since produces a new
 * one. That is what makes the temporal-checksum beat possible without any extra bookkeeping:
 * two ids for one URL means the document moved.
 */
export interface RelaySnapshot {
  readonly id: string
  readonly canonicalUrl: string
  readonly title: string
  /** ISO instant at which the remote host actually answered. */
  readonly remoteFetchedAt: string
  /** SHA-256 over the normalised content, hex. Independent of when it was captured. */
  readonly contentHash: string
  readonly blocks: readonly RelayBlock[]
  readonly outgoingLinks: readonly RelayLink[]
  /** Which provider produced it, so a later change of vendor is visible rather than silent. */
  readonly provider: string
  readonly byteLength: number
}

/** One row of a search result set. Opening one is a separate, metered act. */
export interface RelayResult {
  readonly title: string
  readonly url: string
  readonly snippet: string
}

/** What a provider returns before it is normalised into a snapshot. */
export interface RelayDocument {
  readonly canonicalUrl: string
  readonly title: string
  readonly text: string
  readonly links: readonly RelayLink[]
  readonly remoteFetchedAt: string
}

export interface RelaySearchResponse {
  readonly query: string
  readonly results: readonly RelayResult[]
  readonly provider: string
}

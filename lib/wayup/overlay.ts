import {
  ALL_ALIASES,
  findEntity,
  OWNED_DOMAINS,
  REAL_ENTITY_DENYLIST,
  type UniverseEntity,
} from './universe'
import type { WayUpBlock, WayUpResult, WayUpSnapshot } from './types'

/**
 * A page that exists only inside one timeline, shown among results that came off the real web.
 *
 * The mechanic is deliberate and good: in a game about whether documents are real, a result that
 * is not present in anyone else's baseline is the sharpest tool available. It is also the one
 * place where the product could fabricate a claim about a real person or company and present it
 * to a player as something the network returned. Everything in this file exists to make that
 * impossible by construction rather than by care.
 *
 * Three properties do the work:
 *
 *  1. An overlay is *structurally* not a snapshot. It has no content hash, no remote fetch time,
 *     no provider and no canonical URL, because none of those things happened. A shared shape
 *     with an `isFictional` flag would be one forgotten assignment away from a fictional page
 *     being stored, hashed and served as a capture.
 *  2. An overlay carries a symbol that only `createOverlay` sets. Symbols do not survive
 *     `JSON.parse`, so anything arriving from the database, the network or a cache is provably
 *     not an overlay no matter what it claims about itself.
 *  3. Its subject must be a registered entity of our own universe, and its text is scanned for
 *     real-world names before it is allowed to exist.
 */

/** Set only by `createOverlay`. Cannot be produced by deserialising anything. */
const OVERLAY_BRAND: unique symbol = Symbol('wayup.fictional-overlay')

export class OverlayRefused extends Error {
  constructor(
    readonly reason: string,
    readonly detail: string,
  ) {
    super(`${reason}: ${detail}`)
    this.name = 'OverlayRefused'
  }
}

/** What an author writes. Becomes a `FictionalOverlay` only if it survives the checks. */
export interface OverlayDraft {
  readonly overlayId: string
  /** An entity id from `universe.ts`. The only thing this page is allowed to be about. */
  readonly subject: string
  readonly title: string
  /** Where it appears to live. Must be a host the fiction owns. */
  readonly address: string
  readonly snippet: string
  readonly blocks: readonly WayUpBlock[]
  /**
   * A human has read this and accepts responsibility for what it says. Required for a
   * speculative domain, and the only way past a text-scan finding.
   */
  readonly reviewed?: boolean
  readonly reviewNote?: string
}

export interface FictionalOverlay {
  readonly [OVERLAY_BRAND]: true
  readonly overlayId: string
  readonly subject: string
  readonly title: string
  readonly address: string
  readonly snippet: string
  readonly blocks: readonly WayUpBlock[]
  /**
   * Kept on the object rather than inferred, so a UI that forgets to distinguish an overlay from
   * a capture still has the words in hand. The player is meant to find this unsettling; the data
   * model is not.
   */
  readonly provenance: 'not-present-in-baseline-web'
  readonly reviewed: boolean
  readonly reviewNote: string | null
}

// ---------------------------------------------------------------- text scan

/**
 * Patterns that are almost never right inside an invented page, and are the shapes an accident
 * actually takes: a real domain, a way to contact a real person, a real address.
 */
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const HANDLE = /(^|[\s(])@[a-z0-9_]{2,}/gi
const STREET =
  /\b\d{1,5}\s+(?:[NSEW]{1,2}\s+)?[A-Za-z][A-Za-z.'-]*\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|pkwy|parkway)\b\.?/gi
const HOSTNAME = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]{2,})+\b/gi
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g

/**
 * 555-0100 through 555-0199 is the block reserved for fiction, which is why every number in the
 * authored content sits in it. A number outside it is either real or about to be.
 */
const FICTIONAL_PHONE = /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?555[\s.-]?01\d{2}\b/

/**
 * Suffixes that look like a TLD but are a file. Without these, a page that mentions
 * `README.txt` is refused for naming a real domain, and an author learns to reach for
 * `reviewed: true` reflexively — which would cost more than it saves.
 */
const FILE_SUFFIXES = new Set([
  'txt',
  'html',
  'htm',
  'js',
  'ts',
  'css',
  'json',
  'xml',
  'csv',
  'md',
  'log',
  'dat',
  'enc',
  'sql',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'pdf',
  'zip',
  'gz',
  'tar',
  'exe',
  'dll',
  'sys',
  'ini',
  'cfg',
  'bak',
  'tmp',
  'sock',
  'pid',
  'hex',
  'bin',
  'iso',
  'wav',
  'mp3',
  'mp4',
  'avi',
  'doc',
  'xls',
])

/** Capitalised words that start sentences rather than name things. */
const SENTENCE_STARTERS = new Set([
  'the',
  'a',
  'an',
  'this',
  'that',
  'these',
  'those',
  'it',
  'he',
  'she',
  'they',
  'we',
  'you',
  'i',
  'there',
  'here',
  'his',
  'her',
  'their',
  'our',
  'your',
  'my',
  'its',
  'and',
  'but',
  'or',
  'if',
  'when',
  'while',
  'after',
  'before',
  'no',
  'not',
  'nothing',
  'someone',
  'somebody',
  'something',
  'everyone',
  'nobody',
  'what',
  'who',
  'why',
  'how',
])

const PROPER_NOUN_RUN = /\b[A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})+\b/g

/**
 * Replaces our own vocabulary with spaces, so the scanner only sees what is left over.
 *
 * Domains go first and aliases second, which is not cosmetic: masking the alias "Aion" before
 * the domain leaves `-group.com` behind, and the hostname rule then reports `group.com` as a
 * foreign host. Within each pass, longest first — masking "Aion" before "Aion Group" would strand
 * a bare "Group".
 */
function maskOurs(text: string): string {
  let masked = text
  const domains = [...OWNED_DOMAINS].sort((a, b) => b.length - a.length)
  for (const domain of domains) {
    masked = masked.replaceAll(boundedPattern(domain), ' ')
  }
  for (const alias of ALL_ALIASES) {
    masked = masked.replaceAll(boundedPattern(alias), ' ')
  }
  return masked
}

/**
 * Matches a name only as a whole token.
 *
 * Without the boundaries, masking hides real names inside longer ones: `@aiongroupreal` loses
 * its "aion" and stops looking like a handle, and `Aionics Ltd` becomes `ics Ltd`. `\b` is not
 * enough because several aliases end in punctuation (`Rask, O.`, `m.deleon`), so this brackets
 * on alphanumerics directly.
 */
function boundedPattern(value: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(value)}(?![A-Za-z0-9])`, 'gi')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface ScanFinding {
  readonly rule: string
  readonly match: string
}

/**
 * Looks for real-world names in text that is supposed to be entirely ours.
 *
 * **What this catches:** an email address, an `@handle`, a phone number outside the fictional
 * 555 block, a street address, any hostname that is not one of ours, any name on the denylist in
 * `universe.ts`, and any run of two or more Title Case words left over after our own vocabulary
 * is masked out.
 *
 * **What it provably cannot catch**, and no amount of tightening would:
 *
 *  - A single-word real entity that is not on the denylist. "Nortel", "Zynga", "Bre-X".
 *  - A real person written in lower case, which is exactly how this game's characters type.
 *  - An unmistakable description carrying no proper noun at all — "the search company that
 *    bought the video site in 2006" names nobody and identifies one company.
 *  - Non-Latin scripts, homoglyphs, or a deliberate misspelling.
 *  - Anything requiring knowledge rather than pattern matching.
 *
 * It is a tripwire under the accident, not a model of the world. The accident it is actually
 * under is an author copying a line out of `content/day01/`, where Apple, Amazon, Google,
 * Microsoft, Netflix, Bitcoin, Sony and the Dow all legitimately appear.
 */
export function scanForRealWorld(text: string): ScanFinding[] {
  const findings: ScanFinding[] = []
  const masked = maskOurs(text)

  for (const match of masked.matchAll(EMAIL)) {
    findings.push({ rule: 'email-address', match: match[0] })
  }

  for (const match of masked.matchAll(HANDLE)) {
    findings.push({ rule: 'social-handle', match: match[0].trim() })
  }

  for (const match of masked.matchAll(STREET)) {
    findings.push({ rule: 'street-address', match: match[0] })
  }

  for (const match of masked.matchAll(PHONE)) {
    if (FICTIONAL_PHONE.test(match[0])) continue
    findings.push({ rule: 'telephone-number', match: match[0] })
  }

  for (const match of masked.matchAll(HOSTNAME)) {
    const host = match[0].toLowerCase()
    const suffix = host.slice(host.lastIndexOf('.') + 1)
    if (FILE_SUFFIXES.has(suffix)) continue
    if (OWNED_DOMAINS.has(host)) continue
    findings.push({ rule: 'foreign-hostname', match: match[0] })
  }

  for (const name of REAL_ENTITY_DENYLIST) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i')
    const found = pattern.exec(masked)
    if (found) findings.push({ rule: 'known-real-entity', match: found[0] })
  }

  for (const match of masked.matchAll(PROPER_NOUN_RUN)) {
    const words = match[0].split(/\s+/)
    // Drop a leading article or pronoun: "The Register" is our own, "This Machine" is a sentence.
    const trimmed =
      words.length > 0 && SENTENCE_STARTERS.has((words[0] ?? '').toLowerCase())
        ? words.slice(1)
        : words
    if (trimmed.length < 2) continue
    findings.push({ rule: 'unregistered-proper-noun', match: trimmed.join(' ') })
  }

  return findings
}

// ---------------------------------------------------------------- assertion

function textOf(draft: OverlayDraft): string {
  const blockText = draft.blocks.map((block) => {
    if (block.kind === 'list') return block.items.join('\n')
    return 'text' in block ? block.text : ''
  })
  return [draft.title, draft.snippet, draft.address, ...blockText].join('\n')
}

function assertAddressIsOurs(address: string, entity: UniverseEntity): void {
  const host = address.split('/')[0]?.toLowerCase() ?? ''
  if (!OWNED_DOMAINS.has(host)) {
    throw new OverlayRefused(
      'address-not-ours',
      `${address} is not on a host the fiction owns; an overlay cannot appear to live on somebody else's domain`,
    )
  }
  if (entity.domains.length > 0 && !entity.domains.includes(host)) {
    throw new OverlayRefused('address-wrong-entity', `${address} does not belong to ${entity.id}`)
  }
}

/**
 * The gate. Throws unless the overlay is about something we invented and says nothing about
 * anything we did not.
 */
export function assertOverlayIsOurs(draft: OverlayDraft): void {
  // The escape hatch is the weakest part of this design: it is a boolean an author can set to
  // make a refusal go away. Requiring a note alongside it does not make anyone read the page, but
  // it does mean the bypass cannot be a reflex — someone has to write down who accepted it, and
  // that sentence is what a later reviewer greps for.
  if (draft.reviewed === true && (draft.reviewNote ?? '').trim().length === 0) {
    throw new OverlayRefused(
      'unsigned-review',
      'marking an overlay reviewed requires a reviewNote saying who accepted it and why',
    )
  }

  const entity = findEntity(draft.subject)
  if (!entity) {
    throw new OverlayRefused(
      'unknown-subject',
      `"${draft.subject}" is not an entity of this universe; an overlay may only concern something we invented`,
    )
  }

  assertAddressIsOurs(draft.address, entity)

  const findings = scanForRealWorld(textOf(draft))
  if (findings.length > 0 && draft.reviewed !== true) {
    const summary = findings.map((f) => `${f.rule} (${f.match})`).join(', ')
    throw new OverlayRefused('real-world-reference', summary)
  }
}

/** The only way to make an overlay. Anything that did not come through here is not one. */
export function createOverlay(draft: OverlayDraft): FictionalOverlay {
  assertOverlayIsOurs(draft)
  return {
    [OVERLAY_BRAND]: true,
    overlayId: draft.overlayId,
    subject: draft.subject,
    title: draft.title,
    address: draft.address,
    snippet: draft.snippet,
    blocks: draft.blocks,
    provenance: 'not-present-in-baseline-web',
    reviewed: draft.reviewed === true,
    reviewNote: draft.reviewNote ?? null,
  }
}

/**
 * True only for an object this process built. A JSON round trip drops the symbol, which is the
 * point: an overlay can never arrive from storage or the network.
 */
export function isFictionalOverlay(value: unknown): value is FictionalOverlay {
  return typeof value === 'object' && value !== null && OVERLAY_BRAND in value
}

/** True for a real capture. Checks the fields an overlay structurally does not have. */
export function isCapturedSnapshot(value: unknown): value is WayUpSnapshot {
  if (typeof value !== 'object' || value === null) return false
  if (OVERLAY_BRAND in value) return false
  const candidate = value as Partial<WayUpSnapshot>
  return (
    typeof candidate.contentHash === 'string' &&
    typeof candidate.remoteFetchedAt === 'string' &&
    typeof candidate.provider === 'string' &&
    typeof candidate.canonicalUrl === 'string'
  )
}

// ------------------------------------------------------------------- merge

export type WayUpFeedEntry =
  | { readonly kind: 'real'; readonly result: WayUpResult }
  | { readonly kind: 'overlay'; readonly overlay: FictionalOverlay }

/** Deterministic, so the same timeline sees the overlay in the same place on every replay. */
function stablePosition(overlayId: string, span: number): number {
  let hash = 2166136261
  for (let i = 0; i < overlayId.length; i += 1) {
    hash ^= overlayId.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash % span
}

/**
 * Builds the list the player sees.
 *
 * Real results are passed through by reference and never touched — not reworded, not reordered,
 * not annotated. The overlay sits beside them carrying its own provenance, and never at the top:
 * appearing above every real result would read as the fiction asserting precedence over what the
 * network actually returned.
 *
 * **Nothing calls this yet, and that is deliberate.** The merge, the allowlist and the refusals
 * are complete and tested; no overlay has been authored, and `/api/wayup/search` does not call
 * it. Two decisions have to be made before it does, and neither is a coding decision:
 *
 * 1. *Which overlays apply when.* An overlay is a page about our own fiction placed among real
 *    results, so it has to be gated by day and by what the player has already found — and the
 *    route is stateless. Taking a day from the client would let a save file spoil itself.
 * 2. *What it is worth.* An invented result the player cannot tell from a real one is the most
 *    dangerous thing in this product. The safety is not the code below; it is
 *    `universe.ts`, which refuses anything that is not ours, and an editorial decision about
 *    whether a beat needs this at all.
 *
 * Wiring it without settling those would be worse than leaving it here.
 */
export function mergeSearchResults(
  real: readonly WayUpResult[],
  overlay: FictionalOverlay | null,
): WayUpFeedEntry[] {
  const entries: WayUpFeedEntry[] = real.map((result) => ({ kind: 'real', result }))
  if (!overlay) return entries

  if (!isFictionalOverlay(overlay)) {
    throw new OverlayRefused(
      'unbranded-overlay',
      'this object was not built by createOverlay and cannot be shown as one',
    )
  }

  const index = entries.length === 0 ? 0 : 1 + stablePosition(overlay.overlayId, entries.length)
  entries.splice(index, 0, { kind: 'overlay', overlay })
  return entries
}

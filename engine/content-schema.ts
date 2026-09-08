import { z } from 'zod'

/**
 * Authored content is validated at module load. Narrative truth lives here, never in a
 * component. Nothing in this file may import React, Next or any platform SDK.
 */

const cents = z.number().int()
const id = z.string().min(1)

/**
 * Colours authored into content reach the DOM as inline style values. React sets them as style
 * properties rather than parsing a CSS string, so there is no injection today — but a bare
 * `z.string()` would let a future contributor smuggle a `url(...)` beacon into a page's
 * background. A hex colour is all a 2009 page ever needs.
 */
const cssColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'must be a hex colour')

// --- Evidence & claims -----------------------------------------------------

export const EvidenceSchema = z.object({
  id,
  source: z.string().min(1),
  sourceKind: z.enum(['mail', 'bank', 'files', 'browser', 'phone', 'terminal', 'messenger']),
  text: z.string().min(1),
  tags: z.array(z.string()).default([]),
  reliability: z.enum(['documentary', 'testimonial', 'circumstantial']),
})

export const ClaimSchema = z.object({
  id,
  text: z.string().min(1),
  need: z.array(id).min(1),
  sound: z.boolean(),
  accepted: z.string().min(1),
  rejected: z.string().min(1),
})

// --- Recall ----------------------------------------------------------------

export const MemorySchema = z.object({
  id,
  keys: z.array(z.string().min(1)).min(1),
  text: z.string().min(1),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']),
})

export const RecallConfigSchema = z.object({
  costPerUse: z.number().int().positive(),
  integrityFloor: z.number().int().nonnegative(),
  degradeBelow: z.number().int(),
  fractureBelow: z.number().int(),
  driftSuffix: z.string(),
  fractureSuffix: z.string(),
  noMatchText: z.string().min(1),
  shiftPerUse: z.number().int().nonnegative(),
})

// --- Mail ------------------------------------------------------------------

export const MailMessageSchema = z.object({
  id,
  from: z.string().min(1),
  subject: z.string(),
  time: z.string(),
  meta: z.string(),
  body: z.array(z.string()),
  evidenceId: id.nullable().default(null),
  /**
   * The line of this message somebody else's document disagrees with, quoted.
   *
   * A day's mail is projected into the world graph, where a corpus document can be declared to
   * contradict it. A message is rarely wholly false — "stayed in all evening" is a lie and "i
   * have something that pays" is true and is the hook into tomorrow — so this names the half
   * that is at issue, and it is what the machine shows when it sets the two side by side.
   */
  disputedClaim: z.string().max(300).nullable().default(null),
})

export const UnknownMailSchema = z.object({
  id,
  from: z.string(),
  subject: z.string(),
  time: z.string(),
  meta: z.string(),
  opening: z.string(),
  /** `{{claim}}` is replaced with the last claim filed under the player's name. */
  withClaim: z.string(),
  withoutClaim: z.string(),
  /**
   * Read in order; the first line whose `minHeat` the player has reached is appended. Heat is
   * how loud they were — a file that reported, a claim filed under a name they did not earn.
   */
  heatLines: z
    .array(z.object({ minHeat: z.number().int().nonnegative(), text: z.string().min(1) }))
    .default([]),
  /** Appended when the player wrote in Notes. Length only — never a word of it. */
  notesLine: z.string().nullable().default(null),
  /** Appended when the player wrote down what they know on someone else's machine. */
  watchlistLine: z.string().nullable().default(null),
})

// --- Messenger -------------------------------------------------------------

/**
 * A choice the player can make, and what it actually costs.
 *
 * `reply` is what the other person says back — without it, a dialogue tree is a linear script
 * wearing the costume of a branching one, and the player notices the first time they ask Marc
 * where he was and get a sales pitch about a telephone.
 */
export const ChoiceSchema = z.object({
  text: z.string().min(1),
  /** The answer to *this* question. Empty means the script's next line already answers it. */
  reply: z.string().default(''),
  /** False keeps the conversation on the same node, so the other option stays open. */
  advances: z.boolean().default(true),
  /** Sets a world flag. This is how a choice reaches out of the conversation. */
  setsFlag: z.string().nullable().default(null),
  /** Offered only once the player has pinned this piece of evidence. */
  requiresEvidence: id.nullable().default(null),
})

export const ChatNodeSchema = z.object({
  who: z.string().min(1),
  text: z.string().min(1),
  choices: z.array(ChoiceSchema).default([]),
})

export const ThreadSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  script: z.array(ChatNodeSchema).min(1),
  /** Beat fired when the player replies in this thread. Beats are named by the day. */
  beat: z.string().nullable().default(null),
})

// --- Browser ---------------------------------------------------------------

export const BlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('heading'), text: z.string(), ink: cssColor.default('#22262b') }),
  z.object({ kind: z.literal('sub'), text: z.string() }),
  z.object({ kind: z.literal('subheading'), text: z.string(), ink: cssColor.default('#22262b') }),
  z.object({ kind: z.literal('rule') }),
  z.object({ kind: z.literal('p'), text: z.string() }),
  z.object({
    kind: z.literal('listing'),
    title: z.string(),
    price: z.string(),
    location: z.string(),
    text: z.string(),
    action: z.enum(['buy', 'domain', 'none']),
    itemId: z.string().nullable().default(null),
  }),
  z.object({ kind: z.literal('evidence'), evidenceId: id }),
  // A period site's own navigation row: "Business · Markets · Real Estate".
  z.object({
    kind: z.literal('nav'),
    items: z.array(z.object({ label: z.string(), url: z.string() })).min(1),
  }),
  // A standalone link. `opensApp` lets a page hand the player back to the machine
  // itself — clicking "Online Banking" opens Meridian Savings rather than faking it.
  z.object({
    kind: z.literal('link'),
    label: z.string(),
    url: z.string().nullable().default(null),
    note: z.string().nullable().default(null),
    opensApp: z
      .enum(['mail', 'msg', 'web', 'files', 'bank', 'mkt', 'notes', 'term', 'recall', 'directory'])
      .nullable()
      .default(null),
  }),
])

export const PageVariantSchema = z.object({
  minShift: z.number().int().nonnegative().default(0),
  /** Applies only while this world flag is set — how a decision rewrites a page. */
  whenFlag: z.string().nullable().default(null),
  blocks: z.array(BlockSchema),
})

export const BrowserPageSchema = z.object({
  url: z.string().min(1),
  background: cssColor,
  /** Pages with a dark background invert their body ink. */
  dark: z.boolean().default(false),
  blocks: z.array(BlockSchema),
  variants: z.array(PageVariantSchema).default([]),
})

export const SearchEntrySchema = z.object({
  id,
  keys: z.array(z.string().min(1)).min(1),
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  /** null = an indexed result that does not resolve to a page in this simulation. */
  go: z.string().nullable().default(null),
  variants: z
    .array(
      z.object({
        minShift: z.number().int().nonnegative(),
        title: z.string(),
        snippet: z.string(),
      }),
    )
    .default([]),
})

export const BrowserConfigSchema = z.object({
  home: z.string().min(1),
  engineName: z.string().min(1),
  emptyResults: z.string().min(1),
  /** Where an empty result set points the player instead of a dead end. */
  directoryUrl: z.string().min(1),
  directoryLabel: z.string().min(1),
  notFoundTitle: z.string().min(1),
  notFoundBody: z.string().min(1),
  /** Whoever set this machine up left these behind. */
  bookmarks: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  pages: z.array(BrowserPageSchema).min(1),
  index: z.array(SearchEntrySchema).min(1),
})

// --- Files -----------------------------------------------------------------

export const FileDocSchema = z.object({
  id,
  name: z.string().min(1),
  icon: z.enum(['document', 'encrypted', 'folder', 'image']),
  meta: z.string(),
  metaWhenDecrypted: z.string().nullable().default(null),
  body: z.string(),
  bodyWhenDecrypted: z.string().nullable().default(null),
  evidenceId: id.nullable().default(null),
  /** As on a mail message: the line of this document another document disputes. */
  disputedClaim: z.string().max(300).nullable().default(null),
  evidenceRequiresDecryption: z.boolean().default(false),
  beat: z.string().nullable().default(null),
})

// --- Terminal --------------------------------------------------------------

const TerminalLineSchema = z.object({
  text: z.string(),
  tone: z.enum(['prompt', 'out', 'ok', 'err', 'dim']),
})

export const TerminalConfigSchema = z.object({
  prompt: z.string().min(1),
  banner: TerminalLineSchema,
  statics: z.record(z.string(), z.array(TerminalLineSchema)),
  dateTemplate: z.string(),
  catTargets: z.record(z.string(), id),
  catBinary: z.string(),
  whoami: z.array(TerminalLineSchema),
  /** The machine only contradicts itself once the player can see the contradiction. */
  whoamiAfterEvidence: z.object({ evidenceId: id, lines: z.array(TerminalLineSchema) }),
  notFound: z.string(),
  /**
   * The command that reaches the relay, and what the machine says before and after it works.
   *
   * Authored rather than built in, because whether this day has a way forward at all is a story
   * decision. `null` means the process is not on this machine today.
   */
  relay: z
    .object({
      command: z.string().min(1),
      /** Run without the phrase, before the player has found it. */
      locked: z.array(TerminalLineSchema),
      /** Matched case-insensitively as a substring of the whole line. */
      unlockPhrase: z.string().min(1),
      granted: z.array(TerminalLineSchema),
      /** Run again, once it is known. */
      opened: z.array(TerminalLineSchema),
    })
    .nullable()
    .default(null),
  decrypt: z.object({
    key: z.string().min(1),
    fileId: id,
    evidenceId: id,
    success: z.string(),
    wrongKey: z.string(),
    usage: z.string(),
    maxAttempts: z.number().int().positive(),
    lockout: z.string(),
  }),
})

/**
 * The Way Up Machine, as this day can afford it.
 *
 * Every word the relay says is authored here. The console is a 2009 machine describing something
 * it has no vocabulary for, and that voice is the whole reason the mechanic does not read as a
 * browser tab — so none of it is hard-coded in a component.
 */
export const WayUpConfigSchema = z.object({
  /** How far forward this day can reach. Refilled by `DAY_ADVANCED`. */
  signalBudget: z.number().int().nonnegative(),
  /** What it costs to ask, and what it costs to open one of the answers. */
  searchCost: z.number().int().nonnegative().default(1),
  openCost: z.number().int().nonnegative().default(2),
  title: z.string().min(1),
  subtitle: z.string(),
  /** The prompt above the field. Not "Search" — this machine does not think it is searching. */
  queryLabel: z.string().min(1),
  submitLabel: z.string().min(1),
  /** Shown when no relay is configured on this deployment. */
  offlineTitle: z.string().min(1),
  offlineBody: z.string().min(1),
  /**
   * What the console offers when there is no index: dialling an address it is given. Shown under
   * the offline notice, because a player who has only ever asked questions has no reason to know
   * the field takes anything else.
   */
  offlineDial: z.string().default(''),
  /** Shown when the day's signal is gone. */
  exhausted: z.string().min(1),
  emptyResults: z.string().min(1),
  /** How the console reports each way a request can be refused, keyed by `WayUpRefusal`. */
  refusals: z.record(z.string().max(64), z.string()),
  fallbackRefusal: z.string().min(1),
  /**
   * What carrying a line back costs. Signal buys the looking; these are the price of the
   * carrying — a sentence that has not happened yet, written down on a 2009 machine, moves the
   * world a little because it is now somewhere it was not.
   */
  keepShift: z.number().int().nonnegative().default(1),
  keepHeat: z.number().int().nonnegative().default(0),
  /**
   * The name of the document region, for somebody who cannot see it.
   *
   * The captured page is a list of lines with one tab stop and arrow keys, because "select the
   * text and press keep" is a pointer gesture and would have left the relay's only mechanic
   * unreachable by keyboard.
   */
  docLabel: z.string().default(''),
  /** The heading kept lines sit under, in the tray and on the board. */
  keptHeading: z.string().default(''),
  /**
   * Why they are there and not selectable. A claim in 2009 cannot rest on a document from a year
   * nobody has reached, and the player has to be told that in words rather than by a control
   * quietly not responding.
   */
  keptNote: z.string().default(''),
  /** The day-end line, with `{{count}}`. */
  keptDeed: z.string().default(''),
  /** The control that keeps an excerpt, and the tray heading it lands under. */
  pinLabel: z.string().min(1),
  pinnedLabel: z.string().min(1),
  /** The line under a snapshot that says when the other side answered. */
  capturedTemplate: z.string().min(1),
  signalTemplate: z.string().min(1),

  /**
   * The rest of the console's vocabulary.
   *
   * Every one of these is a word a player reads — including the ones only a screen reader says
   * out loud — so none of them may be written in a component. They default to empty rather than
   * being required because a later day may build a different console out of the same parts, and
   * a missing label should cost that day a label, not the whole content module.
   */
  /** The accessible name of the control that leaves the console. The glyph is not a word. */
  closeLabel: z.string().default(''),
  /** Getting back to what came back, from inside a captured page. */
  backLabel: z.string().default(''),
  /** The heading over the rows the far end returned. */
  resultsLabel: z.string().default(''),
  /** The heading over the addresses a captured page names. */
  linksLabel: z.string().default(''),
  /** What the console says while the line is open and nothing has come back yet. */
  working: z.string().default(''),
  /** What opening one of the returns costs, before the player spends it. `{{cost}}`. */
  costTemplate: z.string().default(''),
  /** How a line is kept: the standing instruction, and the answer to keeping nothing. */
  pinHint: z.string().default(''),
  /** Asked again too soon. `{{seconds}}`. */
  rateLimited: z.string().default(''),
})

// --- Economy ---------------------------------------------------------------

export const OpportunitySchema = z.object({
  id,
  label: z.string().min(1),
  buyCents: cents,
  sellCents: cents,
  buyMinutes: z.number().int().nonnegative(),
  listMinutes: z.number().int().nonnegative(),
  settleMs: z.number().int().nonnegative(),
  shiftOnSell: z.number().int().nonnegative(),
  buyLedgerLabel: z.string(),
  sellLedgerLabel: z.string(),
  beat: z.string().nullable().default(null),
})

export const QuoteSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  price: z.string(),
  change: z.string(),
  direction: z.enum(['up', 'down', 'flat']),
})

export const LedgerEntrySchema = z.object({
  id,
  date: z.string(),
  label: z.string(),
  amount: cents,
  evidenceId: id.nullable().default(null),
})

export const EconomySchema = z.object({
  openingCashCents: cents,
  quotaCents: cents,
  quotaDays: z.number().int().positive(),
  accountLabel: z.string(),
  accountOpened: z.string(),
  /**
   * What pinning the balance panel puts in the tray, or null when this day's account is not
   * itself evidence of anything.
   *
   * Authored rather than hardcoded in `BankApp`, which named `e4` outright — so every day for
   * the next twenty-eight would have had to author an `e4` and make it the bank fact, or the
   * balance panel would offer a pin to something absurd.
   */
  accountEvidenceId: id.nullable().default(null),
  bankName: z.string(),
  brokerageNotice: z.string(),
  brokerageMinimum: z.string(),
  domainPriceCents: cents,
  domainShift: z.number().int().nonnegative(),
  opportunities: z.array(OpportunitySchema),
  quotes: z.array(QuoteSchema),
  openingLedger: z.array(LedgerEntrySchema),
})

// --- Phone -----------------------------------------------------------------

export const SmsNodeSchema = z.object({
  who: z.string(),
  text: z.string(),
  time: z.string(),
  choices: z.array(z.string()).default([]),
  evidenceId: id.nullable().default(null),
})

export const PhotoSchema = z.object({
  id,
  label: z.string(),
  meta: z.string(),
  /** Which frame to draw. A 2009 phone camera, not a stock photo. */
  subject: z.enum(['parking-structure', 'interior-night', 'scanned-page']),
  evidenceId: id.nullable().default(null),
})

export const ContactSchema = z.object({ name: z.string(), number: z.string() })

export const PhoneConfigSchema = z.object({
  device: z.string().min(1),
  carrier: z.string().min(1),
  sms: z.array(SmsNodeSchema).min(1),
  photos: z.array(PhotoSchema),
  contacts: z.array(ContactSchema),
})

// --- Apps ------------------------------------------------------------------

export const AppDefinitionSchema = z.object({
  id: z.enum([
    'mail',
    'msg',
    'web',
    'files',
    'bank',
    'mkt',
    'notes',
    'term',
    'recall',
    'directory',
  ]),
  title: z.string().min(1),
  mono: z.string().length(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

// --- Day end ---------------------------------------------------------------

/**
 * What the day tells the player they did. This is authored, not derived in the engine — the
 * previous version hard-coded Day 01's flags and the phrase "in a dead man's name" inside
 * `selectDeeds`, which put narrative truth in the one place CLAUDE.md says it must never live.
 */
export const DeedsSchema = z.object({
  sold: z.string(),
  lost: z.string(),
  holding: z.string(),
  domain: z.string(),
  watchlist: z.string(),
  recalls: z.string(),
  /**
   * Everything bought on an earlier day, in one line. `{{count}}` items, `{{net}}` the running
   * profit or loss on them.
   *
   * Without it the card reprints every trade of the season every night, and by day ten a page
   * about what the player did today is thirty lines about what they did a week ago.
   */
  earlier: z.string().default(''),
  recallsOne: z.string(),
  recallsMany: z.string(),
  /** A line for each flag the day cares about, in the order it should be read. */
  flagged: z.array(z.object({ whenFlag: z.string().min(1), text: z.string().min(1) })).default([]),
})

export const DayEndSchema = z.object({
  timestamp: z.string(),
  deeds: DeedsSchema,
  title: z.string(),
  watchedLine: z.string(),
  shiftedLine: z.string(),
  saveHeadline: z.string(),
  saveBody: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string(),
  priceLine: z.string(),
  surveillanceDelayMs: z.number().int().nonnegative(),
})

// --- Whole day -------------------------------------------------------------

export const DayContentSchema = z.object({
  day: z.number().int().positive(),
  dateISO: z.string(),
  /** Minutes since midnight. A day that starts at 04:00 is the obvious escalation. */
  wakeMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1439),
  location: z.string(),
  identity: z.string(),
  osName: z.string(),
  boot: z.array(z.string()).min(1),
  bootIntervalMs: z.number().int().positive(),
  bootHoldMs: z.number().int().nonnegative(),
  messengerOpensAtMs: z.number().int().nonnegative(),
  desktopIconAtMs: z.number().int().nonnegative(),
  chatReplyDelayMs: z.number().int().nonnegative(),
  apps: z.array(AppDefinitionSchema).min(1),
  dock: z.array(z.string()).min(1),
  evidence: z.array(EvidenceSchema).min(1),
  /**
   * Evidence from earlier days that this day can still display, with **qualified** ids ("1:e3").
   * A day composes what it inherits explicitly, which keeps the engine a pure function of one
   * day's content rather than needing a lookup across all thirty.
   */
  carriedEvidence: z.array(EvidenceSchema).default([]),
  claims: z.array(ClaimSchema).min(1),
  memories: z.array(MemorySchema).min(1),
  recall: RecallConfigSchema,
  mail: z.array(MailMessageSchema).min(1),
  unknownMail: UnknownMailSchema,
  threads: z.array(ThreadSchema).min(1),
  browser: BrowserConfigSchema,
  files: z.array(FileDocSchema).min(1),
  terminal: TerminalConfigSchema,
  /** `null` on a day with no way forward. */
  wayup: WayUpConfigSchema.nullable().default(null),
  economy: EconomySchema,
  phone: PhoneConfigSchema,
  dayEnd: DayEndSchema,
  /** The gate for *this* day, named however the day likes. */
  requiredBeats: z.array(z.string().min(1)).min(1),
})

export type DayContent = z.infer<typeof DayContentSchema>
export type Block = z.infer<typeof BlockSchema>
export type BrowserPage = z.infer<typeof BrowserPageSchema>
export type SearchEntry = z.infer<typeof SearchEntrySchema>
export type MailMessage = z.infer<typeof MailMessageSchema>
export type FileDoc = z.infer<typeof FileDocSchema>
export type Opportunity = z.infer<typeof OpportunitySchema>
export type Quote = z.infer<typeof QuoteSchema>
export type SmsNode = z.infer<typeof SmsNodeSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Contact = z.infer<typeof ContactSchema>
export type LedgerEntryContent = z.infer<typeof LedgerEntrySchema>
export type Thread = z.infer<typeof ThreadSchema>
export type ChatNode = z.infer<typeof ChatNodeSchema>
export type Choice = z.infer<typeof ChoiceSchema>

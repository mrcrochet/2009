import { z } from 'zod'

/**
 * The shape of an authored case.
 *
 * Content is validated at module load. Narrative truth lives here, never in a component, and
 * nothing in this file may import React, Next or any platform SDK.
 */

const id = z.string().min(1)

/**
 * Colours authored into content reach the DOM as inline style values. React sets them as style
 * properties rather than parsing a CSS string, so there is no injection today — but a bare
 * `z.string()` would let a future contributor smuggle a `url(...)` beacon into a page's
 * background. A hex colour is all a page ever needs.
 */
const cssColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'must be a hex colour')

// --- Evidence & claims -----------------------------------------------------

export const EvidenceSchema = z.object({
  id,
  source: z.string().min(1),
  sourceKind: z.enum(['mail', 'files', 'browser', 'phone', 'terminal', 'messenger', 'device']),
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
   * Read in order; the first line whose `minExposure` the player has reached is appended.
   * Exposure is how visible they made themselves — a lock they forced, a claim on the record.
   */
  exposureLines: z
    .array(z.object({ minExposure: z.number().int().nonnegative(), text: z.string().min(1) }))
    .default([]),
  /** Appended when the player wrote in Notes. Length only — never a word of it. */
  notesLine: z.string().nullable().default(null),
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
  /** Beat fired when the player replies in this thread. Beats are named by the case. */
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
  }),
  z.object({ kind: z.literal('evidence'), evidenceId: id }),
  // A site's own navigation row: "Business · Markets · Real Estate".
  z.object({
    kind: z.literal('nav'),
    items: z.array(z.object({ label: z.string(), url: z.string() })).min(1),
  }),
  // A standalone link. `opensApp` lets a page hand the player back to the machine itself —
  // clicking a carrier's "view your bill" opens the case's own viewer rather than faking it.
  z.object({
    kind: z.literal('link'),
    label: z.string(),
    url: z.string().nullable().default(null),
    note: z.string().nullable().default(null),
    /** Checked against the case's own app registry by `tests/unit/content.test.ts`. */
    opensApp: id.nullable().default(null),
  }),
])

/**
 * A page as it reads once something has happened.
 *
 * Variants were keyed on a drift meter as well as on flags. A meter that silently rewrites the
 * web is a 2009 mechanic; what survives is the half that was always better — a document that
 * reads differently because of something the investigator actually did.
 */
export const PageVariantSchema = z.object({
  whenFlag: z.string().min(1),
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
    .array(z.object({ whenFlag: z.string().min(1), title: z.string(), snippet: z.string() }))
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
 * The relay to the open web, as this case can afford it.
 *
 * Every word the relay says is authored here. That voice is the whole reason the mechanic does
 * not read as a browser tab, so none of it is hard-coded in a component.
 */
export const RelayConfigSchema = z.object({
  /** How many lookups this case pays for. */
  signalBudget: z.number().int().nonnegative(),
  /**
   * Whether the workstation opens the line without being asked.
   *
   * A case decides. Some hand the investigator the relay with the machine; some make it a
   * process they have to find running, which is the better beat and not every case's to use.
   */
  availableAtStart: z.boolean().default(false),
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
  /** Shown when the case's signal is gone. */
  exhausted: z.string().min(1),
  emptyResults: z.string().min(1),
  /** How the console reports each way a request can be refused, keyed by `RelayRefusal`. */
  refusals: z.record(z.string().max(64), z.string()),
  fallbackRefusal: z.string().min(1),
  /**
   * What carrying a line back costs. Signal buys the looking; this is the price of the
   * carrying — reaching outside the case file is a thing somebody can notice.
   */
  keepExposure: z.number().int().nonnegative().default(0),
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
   * Why they are there and not selectable. A filed claim rests on the case file; a line off the
   * open web is context, and the player has to be told that in words rather than by a control
   * quietly not responding.
   */
  keptNote: z.string().default(''),
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
   * being required because another case may build a different console out of the same parts, and
   * a missing label should cost that case a label, not the whole content module.
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

/**
 * An application this case ships.
 *
 * The id was an enum of ten. A product whose unit is the case has to be able to open a case with
 * a disk-image viewer and no mail client, so which applications exist is authored here, and
 * `tests/unit/content.test.ts` is what checks that the dock and every `opensApp` name one that
 * does.
 */
export const AppDefinitionSchema = z.object({
  id,
  title: z.string().min(1),
  mono: z.string().length(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

// --- Devices ---------------------------------------------------------------

/**
 * A device the case puts on the investigator's desk.
 *
 * This is the structural difference between this product and a game about one phone. The
 * workstation is the machine; a phone, a laptop image or a drive is a *source* attached to it.
 * A case may supply two, one, or none, and the engine does not change shape when it does.
 */
export const DeviceSchema = z.object({
  id,
  kind: z.enum(['phone', 'laptop', 'drive']),
  /** What the workstation calls it: "Daniel's NOVA M12". */
  label: z.string().min(1),
  owner: z.string().min(1),
  /** The line under the label: battery, last sync, size. */
  meta: z.string(),
  /** False for a device the client has not handed over yet. */
  connected: z.boolean().default(true),
  /** True for a device that arrives open. Otherwise the case says what opens it. */
  unlocked: z.boolean().default(false),
  /**
   * What opens it, matched case-insensitively.
   *
   * Checked by the reducer rather than by the component that renders the field, for the same
   * reason every other rule is: "the button did not appear" is a rendering, not a rule, and a
   * save could be edited past it.
   */
  unlockKey: z.string().default(''),
  unlockHint: z.string().default(''),
  wrongKey: z.string().default(''),
  /** Set on the world when this device is opened. */
  setsFlag: z.string().nullable().default(null),
  beat: z.string().nullable().default(null),
})

// --- Forensic services -----------------------------------------------------

/**
 * A recovery offered inside the fiction and charged outside it.
 *
 * Two rules hold this honest, and neither is enforced here. The grant is a **server-side
 * entitlement** — `services` on the state is a projection of one, never the check itself. And
 * nothing a claim needs may sit behind one: `tests/unit/content.test.ts` fails the build when a
 * required evidence id is reachable only through a service, because a case that cannot be closed
 * without paying is a different product from the one being sold.
 */
export const ServiceSchema = z.object({
  id,
  /** The entitlement the server grants, e.g. "case001.call_history". */
  entitlement: z.string().min(1),
  title: z.string().min(1),
  /** What the machine reports missing, before any price is mentioned. */
  unavailable: z.string().min(1),
  /** What the recovery would return, in the machine's own words. */
  offer: z.string().min(1),
  /**
   * Said in the player's world rather than the fiction's.
   *
   * A purchase inside a simulated computer is the one place a product like this can mislead
   * somebody without meaning to, so the sentence that says the money is real is authored
   * content and not a component's footnote.
   */
  realityNote: z.string().min(1),
  grantsEvidenceIds: z.array(id).default([]),
  grantsFileIds: z.array(id).default([]),
  completed: z.string().min(1),
})

// --- The report ------------------------------------------------------------

/**
 * What the case tells the investigator they did.
 *
 * Authored, never derived in the engine: the previous version hard-coded one day's flags and the
 * phrase "in a dead man's name" inside a selector, which put narrative truth in the one place it
 * must never live.
 */
export const DeedsSchema = z.object({
  evidence: z.string(),
  claims: z.string(),
  devices: z.string(),
  notes: z.string(),
  kept: z.string(),
  /** A line for each flag the case cares about, in the order it should be read. */
  flagged: z.array(z.object({ whenFlag: z.string().min(1), text: z.string().min(1) })).default([]),
})

export const ReportSchema = z.object({
  timestamp: z.string(),
  deeds: DeedsSchema,
  title: z.string(),
  watchedLine: z.string(),
  exposedLine: z.string(),
  saveHeadline: z.string(),
  saveBody: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string(),
  priceLine: z.string(),
  surveillanceDelayMs: z.number().int().nonnegative(),
})

// --- The whole case --------------------------------------------------------

export const CaseContentSchema = z.object({
  id,
  number: z.number().int().positive(),
  title: z.string().min(1),
  /** Who brought it in. */
  client: z.string().min(1),
  summary: z.string().min(1),
  /** The date the investigation is happening. */
  dateISO: z.string(),
  /** Minutes since midnight at which the investigator sits down. */
  startMinute: z.number().int().min(0).max(1439),
  /** How long the session can run before the case closes itself. */
  sessionMinutes: z.number().int().positive(),
  location: z.string(),
  investigator: z.string(),
  osName: z.string(),
  boot: z.array(z.string()).min(1),
  bootIntervalMs: z.number().int().positive(),
  bootHoldMs: z.number().int().nonnegative(),
  messengerOpensAtMs: z.number().int().nonnegative(),
  desktopIconAtMs: z.number().int().nonnegative(),
  /** The file that appears on the desktop shortly after boot. It said `readme` in a component. */
  desktopIconFileId: id,
  chatReplyDelayMs: z.number().int().nonnegative(),
  apps: z.array(AppDefinitionSchema).min(1),
  dock: z.array(z.string()).min(1),
  /** A case may supply two devices, one, or none. */
  devices: z.array(DeviceSchema).default([]),
  services: z.array(ServiceSchema).default([]),
  evidence: z.array(EvidenceSchema).min(1),
  claims: z.array(ClaimSchema).min(1),
  mail: z.array(MailMessageSchema).min(1),
  unknownMail: UnknownMailSchema,
  threads: z.array(ThreadSchema).min(1),
  browser: BrowserConfigSchema,
  files: z.array(FileDocSchema).min(1),
  terminal: TerminalConfigSchema,
  /** `null` on a case with no line to the open web. */
  relay: RelayConfigSchema.nullable().default(null),
  /** `null` on a case that supplies no phone. */
  phone: PhoneConfigSchema.nullable().default(null),
  report: ReportSchema,
  /** What has to have happened before a report can be filed. */
  requiredBeats: z.array(z.string().min(1)).min(1),
})

export type CaseContent = z.infer<typeof CaseContentSchema>
export type Block = z.infer<typeof BlockSchema>
export type BrowserPage = z.infer<typeof BrowserPageSchema>
export type SearchEntry = z.infer<typeof SearchEntrySchema>
export type MailMessage = z.infer<typeof MailMessageSchema>
export type FileDoc = z.infer<typeof FileDocSchema>
export type SmsNode = z.infer<typeof SmsNodeSchema>
export type Photo = z.infer<typeof PhotoSchema>
export type Contact = z.infer<typeof ContactSchema>
export type Thread = z.infer<typeof ThreadSchema>
export type ChatNode = z.infer<typeof ChatNodeSchema>
export type Choice = z.infer<typeof ChoiceSchema>
export type Device = z.infer<typeof DeviceSchema>
export type Service = z.infer<typeof ServiceSchema>
export type RelayConfig = z.infer<typeof RelayConfigSchema>
export type AppDefinitionInput = z.input<typeof AppDefinitionSchema>

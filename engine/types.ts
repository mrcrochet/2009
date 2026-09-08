import type { Cents } from './money'

export const SCHEMA_VERSION = 8

// ---------------------------------------------------------------------------
// Apps & windows
// ---------------------------------------------------------------------------

export type AppId = 'mail' | 'msg' | 'web' | 'files' | 'bank' | 'mkt' | 'notes' | 'term' | 'recall'

export const APP_IDS: readonly AppId[] = [
  'mail',
  'msg',
  'web',
  'files',
  'bank',
  'mkt',
  'notes',
  'term',
  'recall',
] as const

export type DockId = AppId | 'phone'

export interface AppDefinition {
  readonly id: AppId
  readonly title: string
  /** Single-character fallback glyph. Never an emoji. */
  readonly mono: string
  readonly width: number
  readonly height: number
}

export interface WindowState {
  readonly app: AppId
  readonly x: number
  readonly y: number
  readonly z: number
  readonly minimized: boolean
  /** Titlebar double-click zoom. Restores to the remembered geometry. */
  readonly zoomed: boolean
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

export type PhoneTab = 'sms' | 'photos' | 'contacts'

export interface PhoneState {
  readonly open: boolean
  readonly tab: PhoneTab
  readonly x: number | null
  readonly y: number | null
  readonly smsStep: number
}

// ---------------------------------------------------------------------------
// Investigation
// ---------------------------------------------------------------------------

export type EvidenceSourceKind =
  'mail' | 'bank' | 'files' | 'browser' | 'phone' | 'terminal' | 'messenger'

export type Reliability = 'documentary' | 'testimonial' | 'circumstantial'

export interface Evidence {
  readonly id: string
  /** Human label shown on the card, e.g. "CORVID MAIL — HEADER". */
  readonly source: string
  readonly sourceKind: EvidenceSourceKind
  readonly text: string
  readonly tags: readonly string[]
  readonly reliability: Reliability
}

/** An evidence item once the player has actually pinned it. */
export interface PinnedEvidence {
  readonly id: string
  readonly discoveredBy: EvidenceSourceKind
  /** minuteOfDay at which it was pinned. */
  readonly discoveredAt: number
}

export type ClaimVerdictKind = 'accepted' | 'insufficient' | 'refused'

export interface Claim {
  readonly id: string
  readonly text: string
  /** The exact evidence set this claim rests on. */
  readonly need: readonly string[]
  /** False for claims that are unsound however they are supported. */
  readonly sound: boolean
  readonly accepted: string
  readonly rejected: string
}

export interface ClaimAttempt {
  readonly claimId: string
  readonly claimText: string
  readonly evidenceIds: readonly string[]
  readonly verdict: ClaimVerdictKind
  readonly message: string
  readonly at: number
  /** True when the attempt was filed on the record under the player's name. */
  readonly onRecord: boolean
}

// ---------------------------------------------------------------------------
// Recall
// ---------------------------------------------------------------------------

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'FRACTURED' | 'NONE'

export interface Memory {
  readonly id: string
  readonly keys: readonly string[]
  readonly text: string
  readonly confidence: Exclude<Confidence, 'FRACTURED'>
}

export interface RecallResult {
  readonly query: string
  readonly text: string
  readonly confidence: Confidence
  readonly memoryId: string | null
  readonly cost: number
  readonly at: number
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

export type BrowserView = 'home' | 'results' | 'page'

export interface BrowserEntry {
  readonly view: BrowserView
  readonly url: string
  readonly query: string
  readonly resultIds: readonly string[]
}

export interface BrowserState extends BrowserEntry {
  /**
   * What is in the address bar, when it differs from where the player actually is. A typed but
   * unsubmitted address is a draft — it must not move the browser, and it does not replay.
   */
  readonly draftUrl: string | null
  /** Real back-stack. The URL field and the back button both operate on it. */
  readonly history: readonly BrowserEntry[]
  /** Everything the player has stepped back past, until they navigate somewhere new. */
  readonly forward: readonly BrowserEntry[]
}

// ---------------------------------------------------------------------------
// Messenger / terminal / notes
// ---------------------------------------------------------------------------

export type ThreadId = 'unknown' | 'marc' | 'lea'

export interface ChatLine {
  readonly who: string
  readonly text: string
  readonly mine: boolean
  readonly time: string
}

export interface TerminalLine {
  readonly text: string
  readonly tone: 'prompt' | 'out' | 'ok' | 'err' | 'dim'
}

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

export interface InventoryItem {
  readonly id: string
  readonly label: string
  readonly acquiredFor: Cents
  readonly state: 'held' | 'listed' | 'sold'
  readonly soldFor: Cents | null
}

export interface LedgerEntry {
  readonly id: string
  readonly date: string
  readonly label: string
  readonly amount: Cents
}

// ---------------------------------------------------------------------------
// Day 01 beats
// ---------------------------------------------------------------------------

/**
 * A beat is whatever a day says it is. It was a closed union of Day 01's five, which meant a
 * second day had to name its gate after Day 01's characters — and, worse, that the beats were
 * one shared namespace: a finished Day 01 opened Day 02's gate before it started.
 */
export type BeatId = string

export type Stage = 'landing' | 'boot' | 'playing' | 'day-end'

export interface Viewport {
  readonly width: number
  readonly height: number
}

/** Used when a window is opened without a measured viewport (SSR, replay, tests). */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelineState {
  readonly id: string
  readonly ownerId: string | null
  readonly schemaVersion: number
  readonly seed: number

  readonly stage: Stage
  readonly day: number
  readonly dateISO: string
  readonly minuteOfDay: number

  readonly cashCents: Cents
  readonly memoryIntegrity: number
  /** How loud the player has been. Read by the day-end mail, and by later days. */
  readonly heat: number
  /**
   * Reserved. Accumulates alongside `temporalShift` but nothing reads it yet — the world's
   * content keys off `temporalShift` only. Kept so later days can distinguish "how far the
   * timeline has moved" from "how many thresholds it has crossed".
   */
  readonly divergence: number
  readonly temporalShift: number

  readonly bootLine: number

  readonly windows: readonly WindowState[]
  readonly nextZ: number
  readonly desktopIcons: readonly string[]
  readonly phone: PhoneState

  readonly evidence: readonly PinnedEvidence[]
  readonly selectedEvidenceIds: readonly string[]
  readonly selectedClaimId: string | null
  readonly lastVerdict: ClaimAttempt | null
  readonly claimLog: readonly ClaimAttempt[]

  readonly mail: {
    readonly openId: string
    readonly readIds: readonly string[]
    readonly unknownArrived: boolean
  }
  readonly chat: {
    readonly thread: ThreadId
    readonly log: Readonly<Record<ThreadId, readonly ChatLine[]>>
    readonly step: Readonly<Record<ThreadId, number>>
    /**
     * Per thread, because two people can be mid-reply at once. Held globally, the first
     * CHAT_ADVANCED consumed the other thread's answer and put it in the wrong person's mouth —
     * and "typing…" appeared under whichever contact the player happened to be looking at.
     */
    readonly waiting: Readonly<Record<ThreadId, boolean>>
    readonly pendingReply: Readonly<Record<ThreadId, string | null>>
    readonly pendingAdvance: Readonly<Record<ThreadId, boolean>>
  }
  readonly browser: BrowserState
  readonly files: {
    readonly openId: string
    readonly decrypted: boolean
    readonly decryptAttempts: number
  }
  readonly terminal: { readonly lines: readonly TerminalLine[]; readonly input: string }
  readonly notes: string
  readonly recalls: readonly RecallResult[]
  readonly recallQuery: string

  readonly inventory: readonly InventoryItem[]
  readonly ledger: readonly LedgerEntry[]
  readonly domains: readonly string[]
  /**
   * Symbols the player has written down. No money moves — they cannot open a brokerage account
   * on $717.82. It is the act of recording what they know, on a machine someone else is reading.
   */
  readonly watchlist: readonly string[]

  readonly ui: {
    readonly trayOpen: boolean
    readonly boardOpen: boolean
    readonly watched: boolean
    readonly dayCard: boolean
  }

  /** Cleared when a day advances; a day's gate is about that day. */
  readonly beats: Readonly<Record<string, boolean>>
  readonly flags: Readonly<Record<string, boolean>>

  readonly eventLog: readonly GameEvent[]
  readonly createdAt: string
  readonly updatedAt: string
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Every event carries `at` — the minuteOfDay it happened at. */
interface Base {
  readonly at: number
}

export type GameEvent =
  | (Base & { type: 'WOKE_UP' })
  | (Base & { type: 'BOOT_ADVANCED' })
  | (Base & { type: 'BOOT_COMPLETED' })
  | (Base & { type: 'DESKTOP_ICON_APPEARED'; iconId: string })
  | (Base & { type: 'APP_OPENED'; app: AppId; viewport?: Viewport })
  | (Base & { type: 'APP_CLOSED'; app: AppId })
  | (Base & { type: 'APP_FOCUSED'; app: AppId })
  | (Base & { type: 'APP_MINIMIZED'; app: AppId })
  | (Base & { type: 'APP_ZOOM_TOGGLED'; app: AppId })
  | (Base & { type: 'WINDOW_MOVED'; app: AppId; x: number; y: number })
  | (Base & { type: 'PHONE_TOGGLED' })
  | (Base & { type: 'PHONE_TAB_CHANGED'; tab: PhoneTab })
  | (Base & { type: 'PHONE_MOVED'; x: number; y: number })
  | (Base & { type: 'SMS_ADVANCED' })
  | (Base & { type: 'MAIL_OPENED'; mailId: string })
  | (Base & { type: 'MAIL_UNKNOWN_ARRIVED' })
  | (Base & { type: 'THREAD_SELECTED'; thread: ThreadId })
  | (Base & {
      type: 'CHAT_REPLY_SENT'
      thread: ThreadId
      text: string
      reply?: string
      advances?: boolean
      setsFlag?: string | null
    })
  | (Base & { type: 'CHAT_STARTED'; thread: ThreadId })
  | (Base & { type: 'CHAT_ADVANCED'; thread: ThreadId })
  | (Base & { type: 'BROWSER_QUERY_CHANGED'; query: string })
  | (Base & { type: 'BROWSER_URL_CHANGED'; url: string })
  | (Base & { type: 'BROWSER_SEARCHED'; query: string })
  | (Base & { type: 'BROWSER_NAVIGATED'; url: string })
  | (Base & { type: 'BROWSER_WENT_BACK' })
  | (Base & { type: 'BROWSER_WENT_FORWARD' })
  | (Base & { type: 'FILE_OPENED'; fileId: string })
  | (Base & { type: 'TERMINAL_INPUT_CHANGED'; value: string })
  | (Base & { type: 'TERMINAL_COMMAND_RUN'; command: string })
  | (Base & { type: 'NOTES_CHANGED'; value: string })
  | (Base & { type: 'RECALL_QUERY_CHANGED'; value: string })
  | (Base & { type: 'RECALL_USED'; query: string })
  | (Base & { type: 'EVIDENCE_PINNED'; evidenceId: string; via: EvidenceSourceKind })
  | (Base & { type: 'EVIDENCE_SELECTION_TOGGLED'; evidenceId: string })
  | (Base & { type: 'CLAIM_SELECTED'; claimId: string })
  | (Base & { type: 'CLAIM_ASSERTED'; claimId: string; evidenceIds: readonly string[] })
  | (Base & { type: 'TRAY_TOGGLED'; open?: boolean })
  | (Base & { type: 'BOARD_TOGGLED'; open?: boolean })
  | (Base & { type: 'ITEM_PURCHASED'; itemId: string; amountCents: Cents; label: string })
  | (Base & { type: 'ITEM_LISTED'; itemId: string })
  | (Base & { type: 'ITEM_SOLD'; itemId: string; amountCents: Cents })
  | (Base & { type: 'DOMAIN_REGISTERED'; domain: string; amountCents: Cents })
  | (Base & { type: 'WATCHLIST_TOGGLED'; symbol: string })
  | (Base & { type: 'DAY_ENDED' })
  | (Base & { type: 'DAY_CARD_SHOWN' })
  | (Base & { type: 'TIMELINE_CLAIMED'; ownerId: string })

export type GameEventType = GameEvent['type']

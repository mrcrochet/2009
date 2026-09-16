/**
 * The state model of an investigation.
 *
 * The unit is a **case**, not a day. A case is opened, worked, and closed by filing a report;
 * nothing here counts days, carries a balance, or knows what year it is beyond the date the
 * case itself declares. Everything the player becomes during a case lives in one block, and
 * everything that is merely the surface of the machine lives in another.
 */

export const SCHEMA_VERSION = 16

// ---------------------------------------------------------------------------
// Apps & windows
// ---------------------------------------------------------------------------

/**
 * Open, and registered by content.
 *
 * It was a closed union of ten, which meant a case could not ship an application — the one thing
 * a case-shaped product has to be able to do. A case that opens with a forensic image viewer and
 * no mail client is now a content decision, and the reducer refuses an app the case never
 * declared rather than one the type did not list.
 */
export type AppId = string

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
// Devices
// ---------------------------------------------------------------------------

/**
 * A case supplies devices, and some cases supply none.
 *
 * This is the structural difference between this product and a game about one phone: the
 * workstation is the machine the player sits at, and a phone or a disk image is a *source*
 * attached to it. A case with a laptop and no phone, or a name and nothing else, is the same
 * engine with a different manifest.
 */
export type DeviceKind = 'phone' | 'laptop' | 'drive'

export interface DeviceState {
  readonly id: string
  /** Attached to the workstation. A case may hand over a device the player has not yet opened. */
  readonly connected: boolean
  /** Past the lock screen. What unlocks it is authored by the case. */
  readonly unlocked: boolean
}

/**
 * An application on the handset, named by the case.
 *
 * Open like the workstation's `AppId`, and for the same reason: a case that hands over a phone
 * with a banking app and no camera is a content decision. Which of these the build can draw is
 * the registry's business; a case naming one this build does not have gets a screen saying so.
 */
export type MobileAppId = string

/**
 * Where the handset is, as a stack.
 *
 * A phone is not a set of tabs — it is a place you go into and come back out of, and the back
 * gesture is most of what makes it feel like a device rather than a panel. The stack is the
 * whole of that: home is an empty stack, an app pushes, an item inside the app pushes again.
 */
export interface MobileRoute {
  readonly app: MobileAppId
  /** The thing being looked at inside the app: a conversation, a photograph, a call. */
  readonly item: string | null
}

/**
 * The state of a handset on the desk.
 *
 * It is a device runtime rather than a view model. A notification that is still there after it
 * has been read, an app that forgets which conversation was open, a passcode that is only
 * checked by the workstation and never by the phone itself — each of those is a small moment
 * where the player stops believing they are holding a thing.
 */
export interface PhoneState {
  /** On the desk, picked up. Not the same as powered. */
  readonly open: boolean
  readonly x: number | null
  readonly y: number | null
  /** Empty is the home screen. */
  readonly route: readonly MobileRoute[]
  /** Notifications the player has opened. They do not come back. */
  readonly readNotifications: readonly string[]
  /** The lock screen's own attempt counter, separate from the workstation's. */
  readonly passcodeAttempts: number
  /** How far down the thread the player has read. */
  readonly smsStep: number
}

/**
 * What Quick Look is holding up.
 *
 * A reference rather than a copy: the overlay shows the same document the window shows, read
 * from the same content, so the two can never drift into disagreeing about what a file says.
 */
export interface QuickLookRef {
  readonly kind: 'file' | 'photo'
  readonly id: string
}

// ---------------------------------------------------------------------------
// Investigation
// ---------------------------------------------------------------------------

export type EvidenceSourceKind =
  'mail' | 'files' | 'browser' | 'phone' | 'terminal' | 'messenger' | 'device'

export type Reliability = 'documentary' | 'testimonial' | 'circumstantial'

export interface Evidence {
  readonly id: string
  /** Human label shown on the card, e.g. "MAIL — HEADER". */
  readonly source: string
  readonly sourceKind: EvidenceSourceKind
  readonly text: string
  readonly tags: readonly string[]
  readonly reliability: Reliability
}

/**
 * An evidence item once the player has actually pinned it.
 *
 * Ids are flat within a case. They were qualified by day because thirty days shared one
 * namespace; a case is its own namespace, and the qualification was carrying a distinction that
 * no longer exists.
 */
export interface PinnedEvidence {
  readonly id: string
  readonly discoveredBy: EvidenceSourceKind
  /** Minutes into the session at which it was pinned. */
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
  /** True when the attempt was filed on the record under the investigator's name. */
  readonly onRecord: boolean
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

export type BrowserView = 'home' | 'results' | 'page'

export interface BrowserEntry {
  readonly view: BrowserView
  readonly url: string
  readonly query: string
  /** Hits in the case's own authored index, which carries its own titles and snippets. */
  readonly resultIds: readonly string[]
  /**
   * Addresses the corpus answered with.
   *
   * The engine cannot search the world — only the shell holds the index — so the addresses come
   * in on the event, the way a navigated artifact's id does. Without this the search engine on
   * this machine saw ten authored pages and called the other eighty-four "0 found", which
   * teaches a player in ten seconds that the internet is a puzzle box with ten rooms in it.
   */
  readonly resultUrls: readonly string[]
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
// Messenger / terminal
// ---------------------------------------------------------------------------

/** Whatever the case's content calls its correspondents. */
export type ThreadId = string

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
// Beats, stage, viewport
// ---------------------------------------------------------------------------

/** A beat is whatever a case says it is. */
export type BeatId = string

/**
 * An excerpt kept from a page on the open web.
 *
 * Provenance is the whole point. The document it came from is outside the case and may have
 * changed since, so what is kept is the snapshot the player actually read, its address, and its
 * title as it stood at capture.
 */
export interface KeptExcerpt {
  readonly id: string
  readonly snapshotId: string
  readonly excerpt: string
  readonly excerptHash: string
  readonly sourceUrl: string
  readonly sourceTitle: string
  readonly capturedAt: number
}

/**
 * A page this investigation brought back through the relay.
 *
 * The id alone was enough to answer "has this been opened before, and is reopening it free".
 * It is not enough to show an investigator what they have spent their signal on — for that the
 * record has to carry where the page came from, and carry it on the event rather than in the
 * snapshot cache, which is server-side and which a replay may not have.
 *
 * `url` and `title` are nullable because a save written before the relay kept them has the ids
 * and nothing else. An empty provenance is the honest shape for "this build did not record it".
 */
export interface RelayCapture {
  readonly snapshotId: string
  readonly url: string | null
  readonly title: string | null
  /** What the look cost in signal. */
  readonly cost: number
  /** The minute of the session it was brought back at. */
  readonly at: number
}

export type Stage = 'intake' | 'boot' | 'playing' | 'report'

export interface Viewport {
  readonly width: number
  readonly height: number
}

/** Used when a window is opened without a measured viewport (SSR, replay, tests). */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

// ---------------------------------------------------------------------------
// Investigation state
// ---------------------------------------------------------------------------

/**
 * One investigator's run at one case.
 *
 * The first block is the case and what the player has made of it — it is what a filed report is
 * written from. The second is the surface of the machine, which is where the windows happen to
 * be sitting and nothing a report would ever cite.
 */
export interface InvestigationState {
  readonly id: string
  readonly ownerId: string | null
  readonly schemaVersion: number
  readonly seed: number

  readonly stage: Stage
  readonly caseId: string
  /** The date the investigation is happening, declared by the case. */
  readonly dateISO: string
  /** Minutes elapsed in this session. The menu-bar clock is this plus the case's start hour. */
  readonly minute: number

  // --- what the player has made of the case --------------------------------

  /**
   * How visible the investigator has made themselves. Contacting a subject, filing a claim on
   * the record and forcing a lock all raise it, and the case's own content reads it.
   */
  readonly exposure: number

  /**
   * World artifacts the player has actually encountered.
   *
   * The graph is complete; what the player knows is not. An entity page shows what they have
   * found and a *count* of what they have not — the shape of the gap is the whole value of the
   * page, and listing the gap would give away the world.
   */
  readonly discovered: readonly string[]

  readonly evidence: readonly PinnedEvidence[]
  readonly claimLog: readonly ClaimAttempt[]
  /** The investigator's own notebook. */
  readonly notes: string
  /** Consequences of decisions. A case about what your choices did cannot forget them. */
  readonly flags: Readonly<Record<string, boolean>>

  /** Devices the case has supplied, by id. */
  readonly devices: Readonly<Record<string, DeviceState>>

  /**
   * Forensic services this investigation has been granted, by id.
   *
   * Mirrored here from the server so the engine can stay pure and a replay can reproduce what
   * the player could see. It is a **projection of an entitlement, never the check itself** — the
   * authority is `lib/billing/entitlement.ts`, and a save that claims a service it was never
   * granted buys nothing, because the content behind it is served, not unlocked client-side.
   */
  readonly services: readonly string[]

  /**
   * The relay to the open web. Snapshots the player has observed are immutable and kept by id;
   * the excerpts they chose to keep carry their own provenance.
   */
  readonly relay: {
    /**
     * Whether this machine will open the line at all.
     *
     * A case decides. Some hand the investigator the relay with the workstation; some make it a
     * process they have to find running. The mechanic is the same either way, which is what
     * makes it a case's decision rather than a build's.
     */
    readonly unlocked: boolean
    /** Everything brought back, newest last, with what it cost and where it came from. */
    readonly captures: readonly RelayCapture[]
    readonly kept: readonly KeptExcerpt[]
    /** Community puzzles this investigation has opened. */
    readonly mysteries: readonly string[]
    readonly signalSpent: number
  }

  // --- the surface of the machine ------------------------------------------

  readonly bootLine: number

  readonly windows: readonly WindowState[]
  readonly nextZ: number
  readonly desktopIcons: readonly string[]
  readonly phone: PhoneState

  readonly selectedEvidenceIds: readonly string[]
  readonly selectedClaimId: string | null
  readonly lastVerdict: ClaimAttempt | null

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
     * CHAT_ADVANCED consumed the other thread's answer and put it in the wrong person's mouth.
     */
    readonly waiting: Readonly<Record<ThreadId, boolean>>
    readonly pendingReply: Readonly<Record<ThreadId, string | null>>
    readonly pendingAdvance: Readonly<Record<ThreadId, boolean>>
  }
  readonly browser: BrowserState
  readonly files: {
    readonly openId: string
    readonly decrypted: Readonly<Record<string, boolean>>
    readonly decryptAttempts: Readonly<Record<string, number>>
  }
  /** Which frame the viewer is on. Playback position is not here: a transport is not state. */
  readonly media: { readonly openPhotoId: string }
  readonly terminal: { readonly lines: readonly TerminalLine[]; readonly input: string }

  readonly ui: {
    readonly trayOpen: boolean
    readonly boardOpen: boolean
    readonly watched: boolean
    readonly reportCard: boolean
    /** Space, on whatever the player has their hands on. `null` when nothing is held up. */
    readonly quickLook: QuickLookRef | null
  }

  /** The gate on filing a report. */
  readonly beats: Readonly<Record<string, boolean>>

  readonly eventLog: readonly GameEvent[]
  readonly createdAt: string
  readonly updatedAt: string
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Every event carries `at` — the minute of the session it happened at. */
interface Base {
  readonly at: number
}

export type GameEvent =
  | (Base & { type: 'CASE_OPENED' })
  | (Base & { type: 'BOOT_ADVANCED' })
  | (Base & { type: 'BOOT_COMPLETED' })
  | (Base & { type: 'DESKTOP_ICON_APPEARED'; iconId: string })
  | (Base & { type: 'APP_OPENED'; app: AppId; viewport?: Viewport })
  | (Base & { type: 'APP_CLOSED'; app: AppId })
  | (Base & { type: 'APP_FOCUSED'; app: AppId })
  | (Base & { type: 'APP_MINIMIZED'; app: AppId })
  | (Base & { type: 'APP_ZOOM_TOGGLED'; app: AppId })
  | (Base & { type: 'WINDOW_MOVED'; app: AppId; x: number; y: number })
  | (Base & { type: 'DEVICE_CONNECTED'; deviceId: string })
  | (Base & { type: 'DEVICE_UNLOCK_ATTEMPTED'; deviceId: string; key: string })
  | (Base & { type: 'PHONE_TOGGLED' })
  /** Into an application on the handset, or into a thing inside one. */
  | (Base & { type: 'MOBILE_OPENED'; app: MobileAppId; item?: string | null })
  | (Base & { type: 'MOBILE_BACK' })
  | (Base & { type: 'MOBILE_HOME' })
  /**
   * A notification, read.
   *
   * It carries where it goes, because a notification is a shortcut into an application and the
   * engine should not have to know which. Reading it is what removes it — an alert that survives
   * being opened is the clearest sign a phone is a picture of a phone.
   */
  | (Base & {
      type: 'MOBILE_NOTIFICATION_OPENED'
      notificationId: string
      app: MobileAppId
      item?: string | null
    })
  | (Base & { type: 'PHONE_PASSCODE_ATTEMPTED'; deviceId: string; key: string })
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
  | (Base & {
      type: 'BROWSER_SEARCHED'
      query: string
      /** What the corpus answered, resolved by the shell. */
      webUrls?: readonly string[]
    })
  | (Base & {
      type: 'BROWSER_NAVIGATED'
      url: string
      /**
       * The world artifact living at this address, when the browser found one there.
       *
       * On the event rather than worked out by the reducer, because only the shell holds the
       * world index — and on the event rather than dispatched separately afterwards, because the
       * log has to be able to say what the player read without a second event to correlate.
       */
      worldArtifactId?: string | null
    })
  | (Base & { type: 'BROWSER_WENT_BACK' })
  | (Base & { type: 'BROWSER_WENT_FORWARD' })
  | (Base & { type: 'FILE_OPENED'; fileId: string })
  | (Base & { type: 'PHOTO_SELECTED'; photoId: string })
  /**
   * Held up to the light without opening anything.
   *
   * It is in the log because it is how a player reads half a case — a report written from a
   * session where every document was read in Quick Look should replay as that session, not as
   * one where nothing was ever looked at.
   */
  | (Base & { type: 'QUICK_LOOK_OPENED'; ref: QuickLookRef })
  | (Base & { type: 'QUICK_LOOK_CLOSED' })
  | (Base & { type: 'TERMINAL_INPUT_CHANGED'; value: string })
  | (Base & { type: 'TERMINAL_COMMAND_RUN'; command: string })
  | (Base & { type: 'NOTES_CHANGED'; value: string })
  | (Base & { type: 'EVIDENCE_PINNED'; evidenceId: string; via: EvidenceSourceKind })
  | (Base & { type: 'EVIDENCE_SELECTION_TOGGLED'; evidenceId: string })
  | (Base & { type: 'CLAIM_SELECTED'; claimId: string })
  | (Base & { type: 'CLAIM_ASSERTED'; claimId: string; evidenceIds: readonly string[] })
  | (Base & { type: 'TRAY_TOGGLED'; open?: boolean })
  | (Base & { type: 'BOARD_TOGGLED'; open?: boolean })
  /**
   * A forensic service was granted to this investigation.
   *
   * The grant happened on the server. This records that the player could see what it opened, so
   * a replay shows the investigation they actually ran — it does not *perform* the unlock.
   */
  | (Base & { type: 'SERVICE_GRANTED'; serviceId: string })
  | (Base & { type: 'REPORT_FILED' })
  | (Base & { type: 'REPORT_CARD_SHOWN' })
  | (Base & { type: 'INVESTIGATION_CLAIMED'; ownerId: string })
  | (Base & { type: 'RELAY_UNLOCKED'; via: string })
  /**
   * Asking costs signal even when nothing useful comes back, which is what makes the player
   * think before they ask. The query itself is never carried: freeform player text does not
   * enter the event log any more than it enters analytics.
   */
  | (Base & { type: 'RELAY_SEARCHED'; signalCost: number })
  /**
   * A capture, not a fetch. The network happened outside the engine; what the log records is the
   * immutable snapshot the player saw, so a replay shows the bytes they read rather than
   * whatever the site says today.
   */
  | (Base & {
      type: 'RELAY_SNAPSHOT_OBSERVED'
      snapshotId: string
      signalCost: number
      /**
       * Where the page came from, carried on the event.
       *
       * The state holds snapshot *ids*; the snapshots themselves live in a cache the engine
       * cannot see and a replay may not have. Without this the captures list could say how much
       * signal was spent and never what it was spent on.
       */
      url: string
      title: string
    })
  | (Base & {
      type: 'RELAY_EXCERPT_KEPT'
      id: string
      snapshotId: string
      excerpt: string
      excerptHash: string
      /**
       * Where the line came from, carried on the event rather than looked up. The state holds
       * snapshot *ids*; the snapshots themselves live in a cache the engine cannot see and a
       * replay may not have.
       */
      sourceUrl: string
      sourceTitle: string
    })
  | (Base & { type: 'MYSTERY_OPENED'; mysteryId: string; setsFlags: readonly string[] })
  /** The player met a surface. Batched, because opening a page reveals everything on it. */
  | (Base & { type: 'WORLD_ARTIFACTS_SEEN'; artifactIds: readonly string[] })

export type GameEventType = GameEvent['type']

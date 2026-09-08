import type { DayContent } from './content-schema'
import { DEFAULT_END_MINUTE } from './clock'
import { qualifyEvidenceId } from './types'
import {
  cascadePosition,
  clampPhone,
  clampWindow,
  evaluateClaim,
  resolveRecall,
  searchIndex,
} from './rules'
import { findPage } from './temporal'
import {
  DEFAULT_VIEWPORT,
  type AppId,
  type BeatId,
  type BrowserEntry,
  type Claim,
  type GameEvent,
  type InventoryItem,
  type LedgerEntry,
  type TerminalLine,
  type ThreadId,
  type TimelineState,
  type Viewport,
} from './types'

/**
 * The single pure transition of the game. No timers, no I/O, no framework. All scheduling lives
 * in the React shell, which dispatches ordinary events when a timer fires — so replaying the
 * event log through `reduce` reproduces a snapshot exactly.
 */

/**
 * Ceilings the reducer enforces, matching `engine/timeline-schema.ts` exactly.
 *
 * Without these the game happily builds a timeline the runtime schema rejects — and because the
 * local IndexedDB path does not validate, the player finds out at the paywall, after Day 01 has
 * done its job, when they try to keep the thing they just made. A limit is only real if the code
 * that grows the array is the code that knows about it.
 */
export const LIMITS = {
  recalls: 128,
  terminalLines: 512,
  claimLog: 128,
  notes: 20_000,
  discovered: 4096,
  wayupObserved: 512,
  futureEvidence: 256,
} as const

// How much in-world time each action costs.
const TICK: Partial<Record<GameEvent['type'], number>> = {
  EVIDENCE_PINNED: 1,
  CLAIM_ASSERTED: 6,
  CHAT_REPLY_SENT: 2,
  BROWSER_SEARCHED: 2,
  BROWSER_NAVIGATED: 1,
  TERMINAL_COMMAND_RUN: 1,
  RECALL_USED: 4,
  SMS_ADVANCED: 2,
  APP_OPENED: 0,
}

// How far each action moves the world away from its authored baseline.
const DIVERGENCE: Partial<Record<GameEvent['type'], number>> = {
  RECALL_USED: 2,
  DOMAIN_REGISTERED: 5,
  ITEM_SOLD: 4,
}

export function reduce(state: TimelineState, event: GameEvent, content: DayContent): TimelineState {
  const next = apply(state, event, content)
  if (next === state) return state

  const tick = TICK[event.type] ?? 0
  const divergence = DIVERGENCE[event.type] ?? 0

  const minuteOfDay =
    next.minuteOfDay === state.minuteOfDay ? state.minuteOfDay + tick : next.minuteOfDay

  return {
    ...next,
    // A day cannot run past its own end. Without this the clock wraps to 00:12 while the menu
    // bar still says Thursday the 15th, and `DAY_ENDED` then moves the clock backwards.
    minuteOfDay: Math.min(minuteOfDay, content.endMinute ?? DEFAULT_END_MINUTE),
    divergence:
      next.divergence === state.divergence ? state.divergence + divergence : next.divergence,
  }
}

/**
 * Replay. A multi-day log has to be reduced against the content of the day each event belongs
 * to, so this accepts a resolver as well as a single day — passing one day's content for a log
 * that crosses midnight would quietly interpret Day 02's events against Day 01's world.
 */
export function applyEvents(
  state: TimelineState,
  events: readonly GameEvent[],
  content: DayContent | ((day: number) => DayContent),
): TimelineState {
  const resolve = typeof content === 'function' ? content : () => content
  return events.reduce((acc, e) => {
    // `DAY_ADVANCED` is reduced against the day being *left*; everything after it belongs to the
    // day being entered.
    const dayContent = resolve(acc.day)
    return reduce(acc, e, dayContent)
  }, state)
}

// ---------------------------------------------------------------------------

function withBeat(state: TimelineState, beat: BeatId | null | undefined): TimelineState {
  if (!beat || state.beats[beat]) return state
  return { ...state, beats: { ...state.beats, [beat]: true } }
}

function appDef(content: DayContent, app: AppId) {
  const def = content.apps.find((a) => a.id === app)
  if (!def) throw new Error(`reducer: unknown app "${app}"`)
  return def
}

function focusWindows(state: TimelineState, app: AppId): TimelineState {
  const z = state.nextZ + 1
  return {
    ...state,
    nextZ: z,
    windows: state.windows.map((w) => (w.app === app ? { ...w, z, minimized: false } : w)),
  }
}

/**
 * What a 2009 address bar forgave: a scheme, a `www.`, a trailing slash, stray case in the host.
 * The query string is left exactly as typed so percent-encoding survives.
 */
export function normalizeUrl(raw: string): string {
  let url = raw.trim()
  url = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  url = url.replace(/^www\./i, '')
  const cut = url.search(/[?#]/)
  const path = cut === -1 ? url : url.slice(0, cut)
  const rest = cut === -1 ? '' : url.slice(cut)

  // Only the host is case-insensitive. Lowercasing the path too would make
  // `geohost.com/Terminal/4417` a different page from the one that was authored — and on a real
  // 2009 server it was a different page.
  const slash = path.indexOf('/')
  const host = (slash === -1 ? path : path.slice(0, slash)).toLowerCase()
  const rest0 = slash === -1 ? '' : path.slice(slash)
  return (host + rest0).replace(/\/+$/, '') + rest
}

function currentEntry(state: TimelineState): BrowserEntry {
  return {
    view: state.browser.view,
    url: state.browser.url,
    query: state.browser.query,
    resultIds: state.browser.resultIds,
  }
}

function pushHistory(state: TimelineState): readonly BrowserEntry[] {
  const current = currentEntry(state)
  const last = state.browser.history[state.browser.history.length - 1]
  if (last && last.view === current.view && last.url === current.url) return state.browser.history
  return [...state.browser.history, current].slice(-40)
}

function pinEvidence(
  state: TimelineState,
  evidenceId: string,
  via: TimelineState['evidence'][number]['discoveredBy'],
  at: number,
): TimelineState {
  // Qualified by the day it was found on. Ids were one flat namespace, so a later day reusing an
  // earlier day's page could hand the player evidence they never encountered.
  const id = qualifyEvidenceId(state.day, evidenceId)
  if (state.evidence.some((e) => e.id === id)) return state
  return {
    ...state,
    evidence: [...state.evidence, { id, day: state.day, discoveredBy: via, discoveredAt: at }],
    ui: { ...state.ui, trayOpen: true },
  }
}

function ledgerEntry(id: string, date: string, label: string, amount: number): LedgerEntry {
  return { id, date, label, amount }
}

function dayDateLabel(content: DayContent): string {
  const d = new Date(`${content.dateISO}T00:00:00Z`)
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][d.getUTCMonth()]
  return `${d.getUTCDate()} ${month}`
}

// ---------------------------------------------------------------------------

function apply(state: TimelineState, event: GameEvent, content: DayContent): TimelineState {
  switch (event.type) {
    // --- stage -------------------------------------------------------------
    case 'WOKE_UP':
      if (state.stage !== 'landing') return state
      return { ...state, stage: 'boot', bootLine: 0 }

    case 'BOOT_ADVANCED': {
      if (state.stage !== 'boot') return state
      return { ...state, bootLine: Math.min(state.bootLine + 1, content.boot.length) }
    }

    case 'BOOT_COMPLETED':
      if (state.stage === 'playing') return state
      return { ...state, stage: 'playing', bootLine: content.boot.length }

    case 'DESKTOP_ICON_APPEARED':
      if (state.desktopIcons.includes(event.iconId)) return state
      return { ...state, desktopIcons: [...state.desktopIcons, event.iconId] }

    // --- windows -----------------------------------------------------------
    case 'APP_OPENED': {
      const def = appDef(content, event.app)
      if (state.windows.some((w) => w.app === event.app)) return focusWindows(state, event.app)
      const viewport: Viewport = event.viewport ?? DEFAULT_VIEWPORT
      const { x, y } = cascadePosition(state.windows.length, def.width, def.height, viewport)
      const z = state.nextZ + 1
      return {
        ...state,
        nextZ: z,
        windows: [...state.windows, { app: event.app, x, y, z, minimized: false, zoomed: false }],
      }
    }

    case 'APP_CLOSED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return { ...state, windows: state.windows.filter((w) => w.app !== event.app) }
    }

    case 'APP_FOCUSED': {
      const w = state.windows.find((v) => v.app === event.app)
      if (!w) return state
      const isTop = state.windows.every((v) => v.z <= w.z)
      if (isTop && !w.minimized) return state
      return focusWindows(state, event.app)
    }

    case 'APP_MINIMIZED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return {
        ...state,
        windows: state.windows.map((w) => (w.app === event.app ? { ...w, minimized: true } : w)),
      }
    }

    case 'APP_ZOOM_TOGGLED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return {
        ...state,
        windows: state.windows.map((w) => (w.app === event.app ? { ...w, zoomed: !w.zoomed } : w)),
      }
    }

    case 'WINDOW_MOVED': {
      const w = state.windows.find((v) => v.app === event.app)
      if (!w) return state
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return state
      const def = appDef(content, event.app)
      const { x, y } = clampWindow(event.x, event.y, def.width, def.height, DEFAULT_VIEWPORT)
      if (w.x === x && w.y === y) return state
      return {
        ...state,
        windows: state.windows.map((v) => (v.app === event.app ? { ...v, x, y } : v)),
      }
    }

    // --- phone -------------------------------------------------------------
    case 'PHONE_TOGGLED':
      return { ...state, phone: { ...state.phone, open: !state.phone.open } }

    case 'PHONE_TAB_CHANGED':
      if (state.phone.tab === event.tab) return state
      return { ...state, phone: { ...state.phone, tab: event.tab } }

    case 'PHONE_MOVED': {
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return state
      const { x, y } = clampPhone(event.x, event.y, 296, 552, DEFAULT_VIEWPORT)
      if (state.phone.x === x && state.phone.y === y) return state
      return { ...state, phone: { ...state.phone, x, y } }
    }

    case 'SMS_ADVANCED': {
      const last = content.phone.sms.length - 1
      if (state.phone.smsStep >= last) return state
      return {
        ...state,
        phone: { ...state.phone, smsStep: Math.min(state.phone.smsStep + 1, last) },
      }
    }

    // --- mail --------------------------------------------------------------
    case 'MAIL_OPENED': {
      if (state.mail.openId === event.mailId && state.mail.readIds.includes(event.mailId))
        return state
      return {
        ...state,
        mail: {
          ...state.mail,
          openId: event.mailId,
          readIds: state.mail.readIds.includes(event.mailId)
            ? state.mail.readIds
            : [...state.mail.readIds, event.mailId],
        },
      }
    }

    case 'MAIL_UNKNOWN_ARRIVED':
      if (state.mail.unknownArrived) return state
      return { ...state, mail: { ...state.mail, unknownArrived: true }, heat: state.heat + 5 }

    // --- messenger ---------------------------------------------------------
    case 'THREAD_SELECTED':
      if (state.chat.thread === event.thread) return state
      return { ...state, chat: { ...state.chat, thread: event.thread } }

    case 'CHAT_STARTED': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      if ((state.chat.log[event.thread]?.length ?? 0) > 0) return state
      const node = thread.script[0]
      if (!node) return state
      return {
        ...state,
        chat: {
          ...state.chat,
          log: {
            ...state.chat.log,
            [event.thread]: [
              { who: node.who, text: node.text, mine: false, time: minuteLabel(state.minuteOfDay) },
            ],
          },
        },
      }
    }

    case 'CHAT_REPLY_SENT': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      const withLine: TimelineState = {
        ...state,
        // A choice can reach out of the conversation and change the world.
        flags: event.setsFlag ? { ...state.flags, [event.setsFlag]: true } : state.flags,
        chat: {
          ...state.chat,
          waiting: { ...state.chat.waiting, [event.thread]: true },
          pendingReply: { ...state.chat.pendingReply, [event.thread]: event.reply || null },
          pendingAdvance: {
            ...state.chat.pendingAdvance,
            [event.thread]: event.advances !== false,
          },
          log: {
            ...state.chat.log,
            [event.thread]: [
              ...(state.chat.log[event.thread] ?? []),
              { who: 'you', text: event.text, mine: true, time: minuteLabel(state.minuteOfDay) },
            ],
          },
        },
      }
      return withBeat(withLine, thread.beat as BeatId | null)
    }

    case 'CHAT_ADVANCED': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      const current = state.chat.step[event.thread] ?? 0
      const time = minuteLabel(state.minuteOfDay)
      const speaker = thread.script[current]?.who ?? thread.label

      const log = [...(state.chat.log[event.thread] ?? [])]

      // First: the answer to what was actually asked, in this thread.
      const pendingReply = state.chat.pendingReply[event.thread]
      if (pendingReply) {
        log.push({ who: speaker, text: pendingReply, mine: false, time })
      }

      // Then the script moves on — which is how a person changes the subject. A choice marked
      // `advances: false` holds the conversation where it is, so the other option stays open.
      const advance = state.chat.pendingAdvance[event.thread] ?? true
      const step = advance ? current + 1 : current
      const node = advance ? thread.script[step] : undefined
      if (node) log.push({ who: node.who, text: node.text, mine: false, time })

      return {
        ...state,
        chat: {
          ...state.chat,
          waiting: { ...state.chat.waiting, [event.thread]: false },
          pendingReply: { ...state.chat.pendingReply, [event.thread]: null },
          pendingAdvance: { ...state.chat.pendingAdvance, [event.thread]: true },
          step: { ...state.chat.step, [event.thread]: Math.min(step, thread.script.length - 1) },
          log: { ...state.chat.log, [event.thread]: log },
        },
      }
    }

    // --- browser -----------------------------------------------------------
    case 'BROWSER_QUERY_CHANGED':
      return { ...state, browser: { ...state.browser, query: event.query } }

    case 'BROWSER_URL_CHANGED':
      return { ...state, browser: { ...state.browser, draftUrl: event.url } }

    case 'BROWSER_SEARCHED': {
      const query = event.query.trim()
      if (!query) return state
      const resultIds = searchIndex(content, query)
      return {
        ...state,
        browser: {
          view: 'results',
          url: `${content.browser.home}/search?q=${encodeURIComponent(query)}`,
          query,
          resultIds,
          draftUrl: null,
          history: pushHistory(state),
          forward: [],
        },
      }
    }

    case 'BROWSER_NAVIGATED': {
      const url = normalizeUrl(event.url)
      if (!url) return state
      const history = pushHistory(state)
      const page = findPage(content, url)
      return {
        ...state,
        browser: {
          view: !page && url === content.browser.home ? 'home' : 'page',
          url,
          query: state.browser.query,
          resultIds: state.browser.resultIds,
          draftUrl: null,
          history,
          // Going somewhere new is what discards the forward stack, exactly as a
          // period browser did.
          forward: [],
        },
      }
    }

    case 'BROWSER_WENT_BACK': {
      const { history, forward } = state.browser
      const prev = history[history.length - 1]
      if (!prev) return state
      return {
        ...state,
        browser: {
          ...prev,
          draftUrl: null,
          history: history.slice(0, -1),
          forward: [currentEntry(state), ...forward].slice(0, 40),
        },
      }
    }

    case 'BROWSER_WENT_FORWARD': {
      const { history, forward } = state.browser
      const next = forward[0]
      if (!next) return state
      return {
        ...state,
        browser: {
          ...next,
          draftUrl: null,
          history: [...history, currentEntry(state)].slice(-40),
          forward: forward.slice(1),
        },
      }
    }

    // --- files -------------------------------------------------------------
    case 'FILE_OPENED': {
      const doc = content.files.find((f) => f.id === event.fileId)
      if (!doc) return state
      const opened: TimelineState = { ...state, files: { ...state.files, openId: event.fileId } }
      return withBeat(opened, doc.beat as BeatId | null)
    }

    // --- terminal ----------------------------------------------------------
    case 'TERMINAL_INPUT_CHANGED':
      return { ...state, terminal: { ...state.terminal, input: event.value } }

    case 'TERMINAL_COMMAND_RUN':
      return runTerminal(state, event.command, event.at, content)

    // --- notes / recall ----------------------------------------------------
    case 'NOTES_CHANGED': {
      const notes = event.value.slice(0, LIMITS.notes)
      if (state.notes === notes) return state
      return { ...state, notes }
    }

    case 'RECALL_QUERY_CHANGED':
      return { ...state, recallQuery: event.value }

    case 'RECALL_USED': {
      const query = event.query.trim()
      if (!query) return state
      const outcome = resolveRecall(content, query, state.memoryIntegrity)
      const withRecall: TimelineState = {
        ...state,
        memoryIntegrity: outcome.integrity,
        temporalShift: state.temporalShift + content.recall.shiftPerUse,
        recallQuery: '',
        recalls: [
          {
            query: query.toUpperCase(),
            text: outcome.text,
            confidence: outcome.confidence,
            memoryId: outcome.memoryId,
            cost: outcome.cost,
            at: event.at,
          },
          ...state.recalls,
        ].slice(0, LIMITS.recalls),
      }
      return withBeat(withRecall, 'recall')
    }

    // --- investigation -----------------------------------------------------
    case 'EVIDENCE_PINNED':
      return pinEvidence(state, event.evidenceId, event.via, event.at)

    case 'EVIDENCE_SELECTION_TOGGLED': {
      const id = qualifyEvidenceId(state.day, event.evidenceId)
      const selected = state.selectedEvidenceIds.includes(id)
      return {
        ...state,
        selectedEvidenceIds: selected
          ? state.selectedEvidenceIds.filter((x) => x !== id)
          : [...state.selectedEvidenceIds, id],
      }
    }

    case 'CLAIM_SELECTED':
      return { ...state, selectedClaimId: event.claimId, lastVerdict: null }

    case 'CLAIM_ASSERTED': {
      const claim = content.claims.find((c) => c.id === event.claimId) as Claim | undefined
      if (!claim) return state
      // A claim may rest on an earlier day's evidence by naming it outright ("1:e3"); anything
      // unqualified means today's.
      const need = claim.need.map((id) => qualifyEvidenceId(content.day, id))
      const selected = event.evidenceIds.map((id) => qualifyEvidenceId(state.day, id))
      const outcome = evaluateClaim({ ...claim, need }, selected)
      const attempt = {
        claimId: claim.id,
        claimText: claim.text,
        evidenceIds: selected,
        verdict: outcome.verdict,
        message: outcome.message,
        at: event.at,
        onRecord: outcome.onRecord,
      }
      const withClaim: TimelineState = {
        ...state,
        lastVerdict: attempt,
        claimLog: outcome.onRecord
          ? [...state.claimLog, attempt].slice(-LIMITS.claimLog)
          : state.claimLog,
        heat: outcome.onRecord ? state.heat + 10 : state.heat,
        divergence: state.divergence + (outcome.onRecord ? 6 : 1),
      }
      return withBeat(withClaim, 'claim')
    }

    case 'TRAY_TOGGLED': {
      const open = event.open ?? !state.ui.trayOpen
      if (open === state.ui.trayOpen) return state
      return { ...state, ui: { ...state.ui, trayOpen: open } }
    }

    case 'BOARD_TOGGLED': {
      const open = event.open ?? !state.ui.boardOpen
      if (open === state.ui.boardOpen) return state
      return { ...state, ui: { ...state.ui, boardOpen: open } }
    }

    // --- economy -----------------------------------------------------------
    case 'ITEM_PURCHASED': {
      const opp = content.economy.opportunities.find((o) => o.id === event.itemId)
      if (!opp) return state
      if (state.inventory.some((i) => i.id === event.itemId)) return state
      // Cash cannot go negative. Today no reachable sequence of purchases would, but the
      // invariant was absent rather than satisfied, and one more authored domain would break it.
      if (state.cashCents < opp.buyCents) return state
      const item: InventoryItem = {
        id: opp.id,
        label: opp.label,
        acquiredFor: opp.buyCents,
        state: 'held',
        soldFor: null,
      }
      return {
        ...state,
        cashCents: state.cashCents - opp.buyCents,
        minuteOfDay: state.minuteOfDay + opp.buyMinutes,
        inventory: [...state.inventory, item],
        ledger: [
          ledgerEntry(`l-buy-${opp.id}`, dayDateLabel(content), opp.buyLedgerLabel, -opp.buyCents),
          ...state.ledger,
        ],
      }
    }

    case 'ITEM_LISTED': {
      const opp = content.economy.opportunities.find((o) => o.id === event.itemId)
      const held = state.inventory.find((i) => i.id === event.itemId)
      if (!opp || !held || held.state !== 'held') return state
      return {
        ...state,
        minuteOfDay: state.minuteOfDay + opp.listMinutes,
        inventory: state.inventory.map((i) =>
          i.id === event.itemId ? { ...i, state: 'listed' } : i,
        ),
      }
    }

    case 'ITEM_SOLD': {
      const opp = content.economy.opportunities.find((o) => o.id === event.itemId)
      const listed = state.inventory.find((i) => i.id === event.itemId)
      if (!opp || !listed || listed.state !== 'listed') return state
      const sold: TimelineState = {
        ...state,
        cashCents: state.cashCents + opp.sellCents,
        temporalShift: state.temporalShift + opp.shiftOnSell,
        inventory: state.inventory.map((i) =>
          i.id === event.itemId ? { ...i, state: 'sold', soldFor: opp.sellCents } : i,
        ),
        ledger: [
          ledgerEntry(
            `l-sell-${opp.id}`,
            dayDateLabel(content),
            opp.sellLedgerLabel,
            opp.sellCents,
          ),
          ...state.ledger,
        ],
      }
      return withBeat(sold, opp.beat as BeatId | null)
    }

    case 'DOMAIN_REGISTERED': {
      if (state.domains.includes(event.domain)) return state
      if (state.cashCents < content.economy.domainPriceCents) return state
      return {
        ...state,
        domains: [...state.domains, event.domain],
        cashCents: state.cashCents - content.economy.domainPriceCents,
        temporalShift: state.temporalShift + content.economy.domainShift,
        minuteOfDay: state.minuteOfDay + 12,
      }
    }

    case 'WATCHLIST_TOGGLED': {
      const held = state.watchlist.includes(event.symbol)
      return {
        ...state,
        watchlist: held
          ? state.watchlist.filter((s) => s !== event.symbol)
          : [...state.watchlist, event.symbol],
        // Writing down what you know about the future is not free, even when nothing is bought.
        heat: held ? state.heat : state.heat + 2,
      }
    }

    // --- day end -----------------------------------------------------------
    case 'DAY_ENDED': {
      if (state.stage === 'day-end') return state
      return {
        ...state,
        stage: 'day-end',
        minuteOfDay: content.endMinute ?? DEFAULT_END_MINUTE,
        windows: [],
        phone: { ...state.phone, open: false },
        ui: { trayOpen: false, boardOpen: false, watched: true, dayCard: false },
        mail: { ...state.mail, unknownArrived: true, openId: content.unknownMail.id },
      }
    }

    case 'DAY_CARD_SHOWN':
      if (state.ui.dayCard) return state
      return { ...state, ui: { ...state.ui, dayCard: true } }

    /**
     * The night. Everything the player *became* survives; everything that was the surface of one
     * day is cleared. Without this the engine stopped at the summary card and a second day was a
     * separate new game that happened to be dated later.
     */
    case 'DAY_ADVANCED': {
      if (event.day <= state.day) return state
      const emptyByThread = <T>(value: T) =>
        Object.fromEntries(event.threadIds.map((id) => [id, value]))

      return {
        ...state,

        // Carried: cash, coherence, heat, divergence, shift, evidence, claims on record,
        // inventory, the ledger, domains, the watchlist, every recall, the notebook, and every
        // flag a decision set. A game about consequence cannot forget them overnight.

        day: event.day,
        dateISO: event.dateISO,
        stage: 'playing',

        // Reset: the surface of a day.
        minuteOfDay: event.wakeMinute,
        bootLine: 0,
        windows: [],
        nextZ: 20,
        desktopIcons: [],
        // Where the player put the phone down is a preference, not a day.
        phone: { ...state.phone, open: false, tab: 'sms', smsStep: 0 },
        selectedEvidenceIds: [],
        selectedClaimId: null,
        lastVerdict: null,
        mail: { openId: event.firstMailId, readIds: [event.firstMailId], unknownArrived: false },
        chat: {
          thread: event.threadIds[0] ?? state.chat.thread,
          log: emptyByThread([]),
          step: emptyByThread(0),
          waiting: emptyByThread(false),
          pendingReply: emptyByThread(null),
          pendingAdvance: emptyByThread(true),
        },
        browser: {
          view: 'home',
          url: event.browserHome,
          query: '',
          resultIds: [],
          draftUrl: null,
          history: [],
          forward: [],
        },
        // What was decrypted stays decrypted, and the attempts still count against the player.
        files: { ...state.files, openId: event.firstFileId },
        terminal: { lines: [event.terminalBanner], input: '' },
        recallQuery: '',
        // The relay stays open and every page read stays read; only the day's supply refills.
        wayup: { ...state.wayup, signalSpent: 0 },
        ui: { trayOpen: false, boardOpen: false, watched: false, dayCard: false },
        // The gate is about *this* day. Sharing them opened a later day's gate before it began.
        beats: {},
      }
    }

    // --- the relay ---------------------------------------------------------
    case 'WAYUP_UNLOCKED': {
      if (state.wayup.unlocked) return state
      return { ...state, wayup: { ...state.wayup, unlocked: true } }
    }

    /**
     * The network happened outside the engine. What lands here is the id of an immutable
     * snapshot and what the look cost, so a replay shows the bytes the player read rather than
     * whatever the site says today.
     */
    case 'WAYUP_SNAPSHOT_OBSERVED': {
      if (!state.wayup.unlocked) return state
      const seen = state.wayup.observed.includes(event.snapshotId)
      return {
        ...state,
        wayup: {
          ...state.wayup,
          observed: seen
            ? state.wayup.observed
            : [...state.wayup.observed, event.snapshotId].slice(-LIMITS.wayupObserved),
          // A page already read costs nothing to read again. The cost is in reaching for it.
          signalSpent: seen ? state.wayup.signalSpent : state.wayup.signalSpent + event.signalCost,
        },
      }
    }

    case 'WAYUP_EVIDENCE_PINNED': {
      if (!state.wayup.observed.includes(event.snapshotId)) return state
      if (state.wayup.futureEvidence.some((e) => e.excerptHash === event.excerptHash)) return state
      return {
        ...state,
        wayup: {
          ...state.wayup,
          futureEvidence: [
            ...state.wayup.futureEvidence,
            {
              id: event.id,
              snapshotId: event.snapshotId,
              excerpt: event.excerpt,
              excerptHash: event.excerptHash,
              capturedDay: state.day,
              capturedAt: event.at,
            },
          ].slice(-LIMITS.futureEvidence),
        },
        ui: { ...state.ui, trayOpen: true },
      }
    }

    case 'WORLD_ARTIFACTS_SEEN': {
      const fresh = event.artifactIds.filter((id) => !state.discovered.includes(id))
      if (fresh.length === 0) return state
      return { ...state, discovered: [...state.discovered, ...fresh].slice(-LIMITS.discovered) }
    }

    case 'MYSTERY_OPENED': {
      if (state.wayup.mysteries.includes(event.mysteryId)) return state
      return {
        ...state,
        wayup: { ...state.wayup, mysteries: [...state.wayup.mysteries, event.mysteryId] },
        flags: event.setsFlags.reduce(
          (flags, flag) => ({ ...flags, [flag]: true }),
          state.flags as Record<string, boolean>,
        ),
      }
    }

    case 'TIMELINE_CLAIMED':
      if (state.ownerId === event.ownerId) return state
      return { ...state, ownerId: event.ownerId }

    default: {
      // Compile-time exhaustiveness without the runtime hazard: an event type this build does
      // not know — from a forged upload or a save written by a newer client — leaves the
      // timeline exactly as it was.
      assertNever(event)
      return state
    }
  }
}

// ---------------------------------------------------------------------------

function assertNever(_event: never): void {
  /* the type checker does the work; this exists so the runtime does not */
}

function minuteLabel(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function runTerminal(
  state: TimelineState,
  rawCommand: string,
  at: number,
  content: DayContent,
): TimelineState {
  const cfg = content.terminal
  const command = rawCommand.trim()
  const lower = command.toLowerCase()
  const out: TerminalLine[] = [{ text: `${cfg.prompt} ${command}`, tone: 'prompt' }]

  let nextState: TimelineState = { ...state, terminal: { ...state.terminal, input: '' } }

  if (!command) {
    return { ...nextState, terminal: { lines: [...state.terminal.lines, ...out], input: '' } }
  }

  if (lower.split(/\s+/)[0] === 'clear') {
    return { ...nextState, terminal: { lines: [content.terminal.banner], input: '' } }
  }

  // Match on the first token, so `ls -l` is a listing rather than "command not found" — a
  // whole-line match reads as a bug, not as a period detail.
  const verb = lower.split(/\s+/)[0] ?? ''
  const staticOut = cfg.statics[verb]

  if (verb === 'whoami') {
    out.push(...cfg.whoami)
    const contradiction = cfg.whoamiAfterEvidence
    if (state.evidence.some((e) => e.id === contradiction.evidenceId)) {
      out.push(...contradiction.lines)
    }
  } else if (staticOut) {
    out.push(...staticOut)
  } else if (verb === 'date') {
    out.push({
      text: cfg.dateTemplate.replace('{{clock}}', minuteLabel(state.minuteOfDay)),
      tone: 'out',
    })
  } else if (verb === 'cat') {
    const arg = lower.slice(3).trim()
    const fileId = cfg.catTargets[arg]
    const doc = fileId ? content.files.find((f) => f.id === fileId) : undefined
    out.push(doc ? { text: doc.body, tone: 'out' } : { text: cfg.catBinary, tone: 'out' })
  } else if (verb === 'decrypt') {
    const d = cfg.decrypt
    if (state.files.decrypted) {
      out.push({ text: d.success, tone: 'ok' })
    } else if (state.files.decryptAttempts >= d.maxAttempts) {
      // The lockout said "the file has reported". It has to mean it — otherwise the fourth
      // attempt with the right key simply works, and heat accrues without limit.
      out.push({ text: d.lockout, tone: 'err' })
    } else if (lower.includes(d.key)) {
      out.push({ text: d.success, tone: 'ok' })
      nextState = {
        ...nextState,
        files: { ...nextState.files, decrypted: true, openId: d.fileId },
        heat: nextState.heat + 5,
      }
      nextState = pinEvidence(nextState, d.evidenceId, 'terminal', at)
    } else if (lower.includes('--key')) {
      const attempts = state.files.decryptAttempts + 1
      const remaining = Math.max(0, d.maxAttempts - attempts)
      if (remaining <= 0) {
        out.push({ text: d.lockout, tone: 'err' })
        nextState = {
          ...nextState,
          files: { ...nextState.files, decryptAttempts: attempts },
          heat: nextState.heat + 20,
          flags: { ...nextState.flags, decryptReported: true },
        }
      } else {
        out.push({ text: d.wrongKey.replace('{{remaining}}', String(remaining)), tone: 'err' })
        nextState = {
          ...nextState,
          files: { ...nextState.files, decryptAttempts: attempts },
          heat: nextState.heat + 5,
        }
      }
    } else {
      out.push({ text: d.usage, tone: 'dim' })
    }
  } else {
    out.push({
      text: cfg.notFound.replace('{{command}}', command.split(' ')[0] ?? command),
      tone: 'err',
    })
  }

  return {
    ...nextState,
    terminal: {
      lines: [...state.terminal.lines, ...out].slice(-LIMITS.terminalLines),
      input: '',
    },
  }
}

export type { ThreadId }

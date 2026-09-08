import type { DayContent } from './content-schema'
import { DAY_END_MINUTE } from './clock'
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

  return {
    ...next,
    minuteOfDay: next.minuteOfDay === state.minuteOfDay ? state.minuteOfDay + tick : next.minuteOfDay,
    divergence: next.divergence === state.divergence ? state.divergence + divergence : next.divergence,
  }
}

export function applyEvents(
  state: TimelineState,
  events: readonly GameEvent[],
  content: DayContent,
): TimelineState {
  return events.reduce((acc, e) => reduce(acc, e, content), state)
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

function pushHistory(state: TimelineState): readonly BrowserEntry[] {
  const current: BrowserEntry = {
    view: state.browser.view,
    url: state.browser.url,
    query: state.browser.query,
    resultIds: state.browser.resultIds,
  }
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
  if (state.evidence.some((e) => e.id === evidenceId)) return state
  return {
    ...state,
    evidence: [...state.evidence, { id: evidenceId, discoveredBy: via, discoveredAt: at }],
    ui: { ...state.ui, trayOpen: true },
  }
}

function ledgerEntry(id: string, date: string, label: string, amount: number): LedgerEntry {
  return { id, date, label, amount }
}

function dayDateLabel(content: DayContent): string {
  const d = new Date(`${content.dateISO}T00:00:00Z`)
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]
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
      const def = appDef(content, event.app)
      const { x, y } = clampWindow(event.x, event.y, def.width, def.height, DEFAULT_VIEWPORT)
      if (w.x === x && w.y === y) return state
      return { ...state, windows: state.windows.map((v) => (v.app === event.app ? { ...v, x, y } : v)) }
    }

    // --- phone -------------------------------------------------------------
    case 'PHONE_TOGGLED':
      return { ...state, phone: { ...state.phone, open: !state.phone.open } }

    case 'PHONE_TAB_CHANGED':
      if (state.phone.tab === event.tab) return state
      return { ...state, phone: { ...state.phone, tab: event.tab } }

    case 'PHONE_MOVED': {
      const { x, y } = clampPhone(event.x, event.y, 296, 552, DEFAULT_VIEWPORT)
      if (state.phone.x === x && state.phone.y === y) return state
      return { ...state, phone: { ...state.phone, x, y } }
    }

    case 'SMS_ADVANCED': {
      const last = content.phone.sms.length - 1
      if (state.phone.smsStep >= last) return state
      return { ...state, phone: { ...state.phone, smsStep: Math.min(state.phone.smsStep + 1, last) } }
    }

    // --- mail --------------------------------------------------------------
    case 'MAIL_OPENED': {
      if (state.mail.openId === event.mailId && state.mail.readIds.includes(event.mailId)) return state
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
      if (state.chat.log[event.thread].length > 0) return state
      const node = thread.script[0]
      if (!node) return state
      return {
        ...state,
        chat: {
          ...state.chat,
          log: {
            ...state.chat.log,
            [event.thread]: [{ who: node.who, text: node.text, mine: false, time: minuteLabel(state.minuteOfDay) }],
          },
        },
      }
    }

    case 'CHAT_REPLY_SENT': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      const withLine: TimelineState = {
        ...state,
        chat: {
          ...state.chat,
          waiting: true,
          log: {
            ...state.chat.log,
            [event.thread]: [
              ...state.chat.log[event.thread],
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
      const step = state.chat.step[event.thread] + 1
      const node = thread.script[step]
      const log = node
        ? [
            ...state.chat.log[event.thread],
            { who: node.who, text: node.text, mine: false, time: minuteLabel(state.minuteOfDay) },
          ]
        : state.chat.log[event.thread]
      return {
        ...state,
        chat: {
          ...state.chat,
          waiting: false,
          step: { ...state.chat.step, [event.thread]: Math.min(step, thread.script.length - 1) },
          log: { ...state.chat.log, [event.thread]: log },
        },
      }
    }

    // --- browser -----------------------------------------------------------
    case 'BROWSER_QUERY_CHANGED':
      return { ...state, browser: { ...state.browser, query: event.query } }

    case 'BROWSER_URL_CHANGED':
      return { ...state, browser: { ...state.browser, url: event.url } }

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
          history: pushHistory(state),
        },
      }
    }

    case 'BROWSER_NAVIGATED': {
      const url = event.url.trim()
      if (!url) return state
      const history = pushHistory(state)
      const page = findPage(content, url)
      return {
        ...state,
        browser: {
          view: page ? 'page' : url === content.browser.home ? 'home' : 'page',
          url,
          query: state.browser.query,
          resultIds: state.browser.resultIds,
          history,
        },
      }
    }

    case 'BROWSER_WENT_BACK': {
      const history = state.browser.history
      const prev = history[history.length - 1]
      if (!prev) {
        if (state.browser.view === 'home') return state
        return {
          ...state,
          browser: { view: 'home', url: content.browser.home, query: state.browser.query, resultIds: [], history: [] },
        }
      }
      return {
        ...state,
        browser: { ...prev, history: history.slice(0, -1) },
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
    case 'NOTES_CHANGED':
      if (state.notes === event.value) return state
      return { ...state, notes: event.value }

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
        ],
      }
      return withBeat(withRecall, 'recall')
    }

    // --- investigation -----------------------------------------------------
    case 'EVIDENCE_PINNED':
      return pinEvidence(state, event.evidenceId, event.via, event.at)

    case 'EVIDENCE_SELECTION_TOGGLED': {
      const selected = state.selectedEvidenceIds.includes(event.evidenceId)
      return {
        ...state,
        selectedEvidenceIds: selected
          ? state.selectedEvidenceIds.filter((id) => id !== event.evidenceId)
          : [...state.selectedEvidenceIds, event.evidenceId],
      }
    }

    case 'CLAIM_SELECTED':
      return { ...state, selectedClaimId: event.claimId, lastVerdict: null }

    case 'CLAIM_ASSERTED': {
      const claim = content.claims.find((c) => c.id === event.claimId) as Claim | undefined
      if (!claim) return state
      const outcome = evaluateClaim(claim, event.evidenceIds)
      const attempt = {
        claimId: claim.id,
        claimText: claim.text,
        evidenceIds: [...event.evidenceIds],
        verdict: outcome.verdict,
        message: outcome.message,
        at: event.at,
        onRecord: outcome.onRecord,
      }
      const withClaim: TimelineState = {
        ...state,
        lastVerdict: attempt,
        claimLog: outcome.onRecord ? [...state.claimLog, attempt] : state.claimLog,
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
        inventory: state.inventory.map((i) => (i.id === event.itemId ? { ...i, state: 'listed' } : i)),
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
          ledgerEntry(`l-sell-${opp.id}`, dayDateLabel(content), opp.sellLedgerLabel, opp.sellCents),
          ...state.ledger,
        ],
      }
      return withBeat(sold, opp.beat as BeatId | null)
    }

    case 'DOMAIN_REGISTERED': {
      if (state.domains.includes(event.domain)) return state
      return {
        ...state,
        domains: [...state.domains, event.domain],
        cashCents: state.cashCents - content.economy.domainPriceCents,
        temporalShift: state.temporalShift + content.economy.domainShift,
        minuteOfDay: state.minuteOfDay + 12,
      }
    }

    // --- day end -----------------------------------------------------------
    case 'DAY_ENDED': {
      if (state.stage === 'day-end') return state
      return {
        ...state,
        stage: 'day-end',
        minuteOfDay: DAY_END_MINUTE,
        windows: [],
        phone: { ...state.phone, open: false },
        ui: { trayOpen: false, boardOpen: false, watched: true, dayCard: false },
        mail: { ...state.mail, unknownArrived: true, openId: content.unknownMail.id },
      }
    }

    case 'DAY_CARD_SHOWN':
      if (state.ui.dayCard) return state
      return { ...state, ui: { ...state.ui, dayCard: true } }

    case 'TIMELINE_CLAIMED':
      if (state.ownerId === event.ownerId) return state
      return { ...state, ownerId: event.ownerId }

    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}

// ---------------------------------------------------------------------------

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

  if (lower === 'clear') {
    return { ...nextState, terminal: { lines: [content.terminal.banner], input: '' } }
  }

  const staticOut = cfg.statics[lower]
  if (staticOut) {
    out.push(...staticOut)
  } else if (lower === 'date') {
    out.push({ text: cfg.dateTemplate.replace('{{clock}}', minuteLabel(state.minuteOfDay)), tone: 'out' })
  } else if (lower.startsWith('cat')) {
    const arg = lower.slice(3).trim()
    const fileId = cfg.catTargets[arg]
    const doc = fileId ? content.files.find((f) => f.id === fileId) : undefined
    out.push(doc ? { text: doc.body, tone: 'out' } : { text: cfg.catBinary, tone: 'out' })
  } else if (lower.startsWith('decrypt')) {
    const d = cfg.decrypt
    if (state.files.decrypted) {
      out.push({ text: d.success, tone: 'ok' })
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
        nextState = { ...nextState, files: { ...nextState.files, decryptAttempts: attempts }, heat: nextState.heat + 5 }
      }
    } else {
      out.push({ text: d.usage, tone: 'dim' })
    }
  } else {
    out.push({ text: cfg.notFound.replace('{{command}}', command.split(' ')[0] ?? command), tone: 'err' })
  }

  return { ...nextState, terminal: { lines: [...state.terminal.lines, ...out], input: '' } }
}

export type { ThreadId }

import type { Block, DayContent, MailMessage } from './content-schema'
import { clockString, menuBarClock } from './clock'
import { formatMoney, formatSigned } from './money'
import { canEndDay, outstandingBeats } from './rules'
import { findPage, hasWitnessedShift, resolveBlocks, resolveSearchEntry } from './temporal'
import type {
  AppId,
  BeatId,
  Confidence,
  Evidence,
  TimelineState,
} from './types'

/** Derived, framework-free view models. Components render these; they never compute story. */

/**
 * Selectors that build new arrays or objects are memoised on the identity of their inputs.
 * State is immutable, so a one-entry cache is enough — and it is what keeps a subscribing
 * component from re-rendering forever on a fresh array every read.
 */
function memo2<A extends object, B extends object, R>(fn: (a: A, b: B) => R): (a: A, b: B) => R {
  let lastA: A | null = null
  let lastB: B | null = null
  let value: R
  return (a, b) => {
    if (a !== lastA || b !== lastB) {
      lastA = a
      lastB = b
      value = fn(a, b)
    }
    return value
  }
}

export function selectClock(state: TimelineState): string {
  return clockString(state.minuteOfDay)
}

export function selectMenuBarClock(state: TimelineState): string {
  return menuBarClock(state.minuteOfDay, state.dateISO)
}

export function selectFrontApp(state: TimelineState): AppId | null {
  const visible = state.windows.filter((w) => !w.minimized)
  if (visible.length === 0) return null
  return visible.reduce((a, b) => (b.z > a.z ? b : a)).app
}

export function selectFrontTitle(state: TimelineState, content: DayContent): string {
  const app = selectFrontApp(state)
  if (!app) return 'Finder'
  return content.apps.find((a) => a.id === app)?.title ?? 'Finder'
}

export function selectCash(state: TimelineState): string {
  return formatMoney(state.cashCents)
}

// --- Mail ------------------------------------------------------------------

export interface MailRow extends MailMessage {
  readonly unread: boolean
  readonly selected: boolean
}

export const selectMail: (state: TimelineState, content: DayContent) => readonly MailRow[] = memo2((state, content) => {
  const list: MailMessage[] = [...content.mail]
  if (state.mail.unknownArrived) {
    const u = content.unknownMail
    const lastOnRecord = state.claimLog[state.claimLog.length - 1]
    const second = lastOnRecord
      ? u.withClaim.replace('{{claim}}', lastOnRecord.claimText)
      : u.withoutClaim
    list.unshift({
      id: u.id,
      from: u.from,
      subject: u.subject,
      time: u.time,
      meta: u.meta,
      body: [u.opening, second],
      evidenceId: null,
    })
  }
  return list.map((m) => ({
    ...m,
    unread: !state.mail.readIds.includes(m.id),
    selected: state.mail.openId === m.id,
  }))
})

export const selectOpenMail: (state: TimelineState, content: DayContent) => MailRow | null = memo2((state, content) => {
  const list = selectMail(state, content)
  return list.find((m) => m.id === state.mail.openId) ?? list[0] ?? null
})

// --- Messenger -------------------------------------------------------------

export const selectChoices: (state: TimelineState, content: DayContent) => readonly string[] = memo2((state, content) => {
  if (state.chat.waiting) return []
  const thread = content.threads.find((t) => t.id === state.chat.thread)
  if (!thread) return []
  if (state.chat.log[state.chat.thread].length === 0) return []
  return thread.script[state.chat.step[state.chat.thread]]?.choices ?? []
})

// --- Browser ---------------------------------------------------------------

export interface SearchResultRow {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly snippet: string
  readonly go: string | null
}

export const selectSearchResults: (state: TimelineState, content: DayContent) => readonly SearchResultRow[] = memo2((state, content) => {
  return state.browser.resultIds.flatMap((id) => {
    const entry = content.browser.index.find((e) => e.id === id)
    if (!entry) return []
    const { title, snippet } = resolveSearchEntry(entry, state.temporalShift)
    return [{ id: entry.id, title, url: entry.url, snippet, go: entry.go }]
  })
})

export interface PageView {
  readonly found: boolean
  readonly background: string
  readonly dark: boolean
  readonly blocks: readonly Block[]
}

export const selectPage: (state: TimelineState, content: DayContent) => PageView = memo2((state, content) => {
  const page = findPage(content, state.browser.url)
  if (!page) return { found: false, background: '#fff', dark: false, blocks: [] }
  return {
    found: true,
    background: page.background,
    dark: page.dark,
    blocks: resolveBlocks(page, state.temporalShift),
  }
})

// --- Files -----------------------------------------------------------------

export interface FileRow {
  readonly id: string
  readonly name: string
  readonly icon: DayContent['files'][number]['icon']
  readonly meta: string
  readonly selected: boolean
}

export const selectFiles: (state: TimelineState, content: DayContent) => readonly FileRow[] = memo2((state, content) => {
  return content.files.map((f) => ({
    id: f.id,
    name: f.name,
    icon: f.icon,
    meta: state.files.decrypted && f.metaWhenDecrypted ? f.metaWhenDecrypted : f.meta,
    selected: state.files.openId === f.id,
  }))
})

export function selectFileBody(state: TimelineState, content: DayContent): string {
  const doc = content.files.find((f) => f.id === state.files.openId)
  if (!doc) return ''
  if (state.files.decrypted && doc.bodyWhenDecrypted) return doc.bodyWhenDecrypted
  return doc.body
}

export function selectFileEvidenceId(state: TimelineState, content: DayContent): string | null {
  const doc = content.files.find((f) => f.id === state.files.openId)
  if (!doc || !doc.evidenceId) return null
  if (doc.evidenceRequiresDecryption && !state.files.decrypted) return null
  return doc.evidenceId
}

// --- Bank ------------------------------------------------------------------

export interface LedgerRow {
  readonly id: string
  readonly date: string
  readonly label: string
  readonly amount: string
  readonly credit: boolean
  readonly evidenceId: string | null
}

export const selectLedger: (state: TimelineState, content: DayContent) => readonly LedgerRow[] = memo2((state, content) => {
  return state.ledger.map((entry) => {
    const authored = content.economy.openingLedger.find((l) => l.id === entry.id)
    return {
      id: entry.id,
      date: entry.date,
      label: entry.label,
      amount: formatSigned(entry.amount),
      credit: entry.amount >= 0,
      evidenceId: authored?.evidenceId ?? null,
    }
  })
})

// --- Investigation ---------------------------------------------------------

export interface EvidenceCard extends Evidence {
  readonly discoveredAt: number
  readonly selected: boolean
}

export const selectEvidenceCards: (state: TimelineState, content: DayContent) => readonly EvidenceCard[] = memo2((state, content) => {
  return state.evidence.flatMap((pinned) => {
    const def = content.evidence.find((e) => e.id === pinned.id)
    if (!def) return []
    return [
      {
        ...(def as Evidence),
        discoveredAt: pinned.discoveredAt,
        selected: state.selectedEvidenceIds.includes(pinned.id),
      },
    ]
  })
})

export function isPinned(state: TimelineState, evidenceId: string | null | undefined): boolean {
  if (!evidenceId) return false
  return state.evidence.some((e) => e.id === evidenceId)
}

export function pinLabel(state: TimelineState, evidenceId: string | null | undefined): string {
  return isPinned(state, evidenceId) ? 'PINNED' : 'PIN AS EVIDENCE'
}

// --- Recall ----------------------------------------------------------------

export const CONFIDENCE_TONE: Readonly<Record<Confidence, 'good' | 'fair' | 'bad' | 'none'>> = {
  HIGH: 'good',
  MEDIUM: 'fair',
  LOW: 'fair',
  FRACTURED: 'bad',
  NONE: 'none',
}

export function selectIntegrityTone(state: TimelineState): 'good' | 'fair' | 'bad' {
  if (state.memoryIntegrity > 78) return 'good'
  if (state.memoryIntegrity > 52) return 'fair'
  return 'bad'
}

// --- Day gate --------------------------------------------------------------

export function selectCanEndDay(state: TimelineState, content: DayContent): boolean {
  return canEndDay(state.beats, content.requiredBeats as readonly BeatId[])
}

export const selectOutstandingBeats: (state: TimelineState, content: DayContent) => readonly BeatId[] = memo2((state, content) => {
  return outstandingBeats(state.beats, content.requiredBeats as readonly BeatId[])
})

// --- Day summary -----------------------------------------------------------

export interface DaySummary {
  readonly timestamp: string
  readonly balance: string
  readonly quota: string
  readonly daysLeft: number
  readonly integrity: string
  readonly claimCount: number
  readonly holdings: readonly string[]
  readonly shifted: boolean
  readonly watchedLine: string
  readonly shiftedLine: string
}

export const selectDaySummary: (state: TimelineState, content: DayContent) => DaySummary = memo2((state, content) => {
  return {
    timestamp: content.dayEnd.timestamp,
    balance: formatMoney(state.cashCents),
    quota: formatMoney(content.economy.quotaCents),
    daysLeft: content.economy.quotaDays - state.day,
    integrity: `${state.memoryIntegrity}%`,
    claimCount: state.claimLog.length,
    holdings: state.domains,
    shifted: hasWitnessedShift(content, state),
    watchedLine: content.dayEnd.watchedLine,
    shiftedLine: content.dayEnd.shiftedLine,
  }
})

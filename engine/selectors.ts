import type { Block, Choice, DayContent, MailMessage } from './content-schema'
import { clockString, menuBarClock } from './clock'
import { formatMoney, formatSigned } from './money'
import { canEndDay, outstandingBeats } from './rules'
import { findPage, hasWitnessedShift, resolveBlocks, resolveSearchEntry } from './temporal'
import type { AppId, BeatId, Confidence, Evidence, TimelineState } from './types'

/** Derived, framework-free view models. Components render these; they never compute story. */

/**
 * Selectors that build new arrays or objects are memoised on the slices they actually read.
 *
 * Keying on the whole `TimelineState` — which is a new object after *any* event — would prevent
 * the infinite render loop these caches exist for while delivering no re-render avoidance at
 * all: typing one character into Notes would hand every open app a fresh array. Declaring the
 * real dependencies is what makes the cache do its job.
 */
function memoBy<R>(
  deps: (state: TimelineState, content: DayContent) => readonly unknown[],
  compute: (state: TimelineState, content: DayContent) => R,
): (state: TimelineState, content: DayContent) => R {
  let last: readonly unknown[] | null = null
  let value: R
  return (state, content) => {
    const next = deps(state, content)
    if (
      last !== null &&
      next.length === last.length &&
      next.every((d, i) => Object.is(d, last![i]))
    ) {
      return value
    }
    last = next
    value = compute(state, content)
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

export const selectMail: (state: TimelineState, content: DayContent) => readonly MailRow[] = memoBy(
  // Heat and the note length only reach the inbox once the unknown mail has arrived, so before
  // then they must not invalidate it — otherwise typing a note re-renders the mail app.
  (s, c) => [
    s.mail.unknownArrived,
    s.mail.readIds,
    s.mail.openId,
    s.claimLog,
    s.mail.unknownArrived ? s.heat : 0,
    s.mail.unknownArrived ? s.notes.length : 0,
    s.mail.unknownArrived ? s.watchlist : 0,
    c,
  ],
  (state, content) => {
    const list: MailMessage[] = [...content.mail]
    if (state.mail.unknownArrived) {
      const u = content.unknownMail
      const lastOnRecord = state.claimLog[state.claimLog.length - 1]
      const second = lastOnRecord
        ? u.withClaim.replace('{{claim}}', lastOnRecord.claimText)
        : u.withoutClaim
      const body = [u.opening, second]
      // Heat is how loud the player was. The first line they have earned is the one they get.
      const heatLine = u.heatLines.find((line) => state.heat >= line.minHeat)
      if (heatLine) body.push(heatLine.text)
      // Length only. Never a word of what they wrote — that rule holds here as it does in
      // analytics, and it is more frightening this way.
      if (u.notesLine && state.notes.trim().length > 0) {
        body.push(u.notesLine.replace('{{count}}', String(state.notes.length)))
      }
      if (u.watchlistLine && state.watchlist.length > 0) {
        body.push(u.watchlistLine.replace('{{count}}', String(state.watchlist.length)))
      }
      list.unshift({
        id: u.id,
        from: u.from,
        subject: u.subject,
        time: u.time,
        meta: u.meta,
        body,
        evidenceId: null,
      })
    }
    return list.map((m) => ({
      ...m,
      unread: !state.mail.readIds.includes(m.id),
      selected: state.mail.openId === m.id,
    }))
  },
)
export const selectOpenMail: (state: TimelineState, content: DayContent) => MailRow | null = memoBy(
  // Heat and the note length only reach the inbox once the unknown mail has arrived, so before
  // then they must not invalidate it — otherwise typing a note re-renders the mail app.
  (s, c) => [
    s.mail.unknownArrived,
    s.mail.readIds,
    s.mail.openId,
    s.claimLog,
    s.mail.unknownArrived ? s.heat : 0,
    s.mail.unknownArrived ? s.notes.length : 0,
    s.mail.unknownArrived ? s.watchlist : 0,
    c,
  ],
  (state, content) => {
    const list = selectMail(state, content)
    return list.find((m) => m.id === state.mail.openId) ?? list[0] ?? null
  },
)
// --- Messenger -------------------------------------------------------------

/**
 * What the player can say right now. A choice gated on evidence is simply absent until they are
 * holding the thing that lets them ask — you cannot accuse someone of lying before you can prove
 * it, and finding the proof should feel like it opened a door.
 */
export const selectChoices: (state: TimelineState, content: DayContent) => readonly Choice[] =
  memoBy(
    (s, c) => [s.chat.waiting, s.chat.thread, s.chat.step, s.chat.log, s.evidence, c],
    (state, content) => {
      if (state.chat.waiting) return []
      const thread = content.threads.find((t) => t.id === state.chat.thread)
      if (!thread) return []
      if (state.chat.log[state.chat.thread].length === 0) return []
      const node = thread.script[state.chat.step[state.chat.thread]]
      if (!node) return []
      const pinned = new Set(state.evidence.map((e) => e.id))
      return node.choices.filter((c) => !c.requiresEvidence || pinned.has(c.requiresEvidence))
    },
  )
// --- Browser ---------------------------------------------------------------

export interface SearchResultRow {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly snippet: string
  readonly go: string | null
}

export const selectSearchResults: (
  state: TimelineState,
  content: DayContent,
) => readonly SearchResultRow[] = memoBy(
  (s, c) => [s.browser.resultIds, s.temporalShift, c],
  (state, content) => {
    return state.browser.resultIds.flatMap((id) => {
      const entry = content.browser.index.find((e) => e.id === id)
      if (!entry) return []
      const { title, snippet } = resolveSearchEntry(entry, state.temporalShift)
      return [{ id: entry.id, title, url: entry.url, snippet, go: entry.go }]
    })
  },
)
export interface PageView {
  readonly found: boolean
  readonly background: string
  readonly dark: boolean
  readonly blocks: readonly Block[]
}

export const selectPage: (state: TimelineState, content: DayContent) => PageView = memoBy(
  (s, c) => [s.browser.url, s.temporalShift, s.flags, c],
  (state, content) => {
    const page = findPage(content, state.browser.url)
    if (!page) return { found: false, background: '#fff', dark: false, blocks: [] }
    return {
      found: true,
      background: page.background,
      dark: page.dark,
      blocks: resolveBlocks(page, state.temporalShift, state.flags),
    }
  },
)
// --- Files -----------------------------------------------------------------

export interface FileRow {
  readonly id: string
  readonly name: string
  readonly icon: DayContent['files'][number]['icon']
  readonly meta: string
  readonly selected: boolean
}

export const selectFiles: (state: TimelineState, content: DayContent) => readonly FileRow[] =
  memoBy(
    (s, c) => [s.files.decrypted, s.files.openId, c],
    (state, content) => {
      return content.files.map((f) => ({
        id: f.id,
        name: f.name,
        icon: f.icon,
        meta: state.files.decrypted && f.metaWhenDecrypted ? f.metaWhenDecrypted : f.meta,
        selected: state.files.openId === f.id,
      }))
    },
  )
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

export const selectLedger: (state: TimelineState, content: DayContent) => readonly LedgerRow[] =
  memoBy(
    (s, c) => [s.ledger, c],
    (state, content) => {
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
    },
  )
// --- Investigation ---------------------------------------------------------

export interface EvidenceCard extends Evidence {
  readonly discoveredAt: number
  readonly selected: boolean
}

export const selectEvidenceCards: (
  state: TimelineState,
  content: DayContent,
) => readonly EvidenceCard[] = memoBy(
  (s, c) => [s.evidence, s.selectedEvidenceIds, c],
  (state, content) => {
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
  },
)
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

export const selectOutstandingBeats: (
  state: TimelineState,
  content: DayContent,
) => readonly BeatId[] = memoBy(
  (s, c) => [s.beats, c],
  (state, content) => {
    return outstandingBeats(state.beats, content.requiredBeats as readonly BeatId[])
  },
)
// --- Day summary -----------------------------------------------------------

export interface DaySummary {
  readonly timestamp: string
  /** What the player actually did to 15 January 2009, in their own ledger. */
  readonly deeds: readonly string[]
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

/**
 * A stats screen reports numbers. This reports what the player did — every line derived from
 * state that already exists, and every one of them something they chose.
 */
function selectDeeds(state: TimelineState): readonly string[] {
  const deeds: string[] = []

  for (const item of state.inventory) {
    if (item.state === 'sold' && item.soldFor !== null) {
      const verb = item.soldFor >= item.acquiredFor ? 'sold it for' : 'let it go for'
      deeds.push(
        `You bought ${item.label.toLowerCase()} for ${formatMoney(item.acquiredFor)} and ${verb} ${formatMoney(item.soldFor)}.`,
      )
    } else if (item.state !== 'sold') {
      deeds.push(`You are still holding ${item.label.toLowerCase()}.`)
    }
  }

  if (state.files.decrypted) deeds.push('You opened a file that was not addressed to you.')
  if (state.flags.decryptReported) {
    deeds.push('You tried three keys on it before that, and it counted.')
  }
  for (const domain of state.domains) {
    deeds.push(`You registered ${domain} in a dead man's name.`)
  }
  if (state.flags.leaPostedAgain) {
    deeds.push('You told someone to put a description of the car on a public page.')
  }
  if (state.flags.leaPostRemoved) {
    deeds.push('You told someone to take down the only public record of what is happening to her.')
  }
  if (state.watchlist.length > 0) {
    deeds.push(
      `You put ${state.watchlist.join(', ')} on a watchlist, on a machine that is not yours.`,
    )
  }
  if (state.recalls.length > 0) {
    deeds.push(
      `You spent ${state.recalls.length === 1 ? 'one memory' : `${state.recalls.length} memories`} finding out what you already knew.`,
    )
  }

  return deeds
}

export const selectDaySummary: (state: TimelineState, content: DayContent) => DaySummary = memoBy(
  (s, c) => [
    s.cashCents,
    s.memoryIntegrity,
    s.claimLog,
    s.domains,
    s.browser.history,
    s.browser.url,
    s.temporalShift,
    s.day,
    s.inventory,
    s.files,
    s.flags,
    s.recalls,
    s.watchlist,
    c,
  ],
  (state, content) => {
    return {
      timestamp: content.dayEnd.timestamp,
      deeds: selectDeeds(state),
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
  },
)

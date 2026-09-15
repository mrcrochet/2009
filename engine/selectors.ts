import type { Block, CaseContent, Choice, MailMessage } from './case-schema'
import { clockString, menuBarClock } from './clock'
import { findPage, hasWitnessedChange, resolveBlocks, resolveSearchEntry } from './pages'
import { canFileReport, outstandingBeats } from './rules'
import type { AppId, BeatId, Evidence, InvestigationState } from './types'

/** Derived, framework-free view models. Components render these; they never compute story. */

/**
 * Selectors that build new arrays or objects are memoised on the slices they actually read.
 *
 * Keying on the whole state — which is a new object after *any* event — would prevent the
 * infinite render loop these caches exist for while delivering no re-render avoidance at all:
 * typing one character into Notes would hand every open app a fresh array. Declaring the real
 * dependencies is what makes the cache do its job.
 */
function memoBy<R>(
  deps: (state: InvestigationState, content: CaseContent) => readonly unknown[],
  compute: (state: InvestigationState, content: CaseContent) => R,
): (state: InvestigationState, content: CaseContent) => R {
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

/** Wall time: the hour the case started at, plus how long the investigator has been at it. */
export function selectClock(state: InvestigationState, content: CaseContent): string {
  return clockString(content.startMinute + state.minute)
}

export function selectMenuBarClock(state: InvestigationState, content: CaseContent): string {
  return menuBarClock(content.startMinute + state.minute, state.dateISO)
}

export function selectFrontApp(state: InvestigationState): AppId | null {
  const visible = state.windows.filter((w) => !w.minimized)
  if (visible.length === 0) return null
  return visible.reduce((a, b) => (b.z > a.z ? b : a)).app
}

export function selectFrontTitle(state: InvestigationState, content: CaseContent): string {
  const app = selectFrontApp(state)
  if (!app) return 'Workstation'
  return content.apps.find((a) => a.id === app)?.title ?? 'Workstation'
}

// --- Forensic services -----------------------------------------------------

/**
 * Whether a piece of the case is behind a service this investigation has not been granted.
 *
 * The authority on the grant is the server; this reads the projection so the surfaces agree with
 * the reducer about what exists. Both of them refusing is what stops a pin button offering
 * evidence the player has not been given.
 */
export function isWithheld(
  state: InvestigationState,
  content: CaseContent,
  kind: 'evidence' | 'file',
  id: string,
): boolean {
  const gate = content.services.find((svc) =>
    kind === 'evidence' ? svc.grantsEvidenceIds.includes(id) : svc.grantsFileIds.includes(id),
  )
  return gate ? !state.services.includes(gate.id) : false
}

export interface ServiceRow {
  readonly id: string
  readonly title: string
  readonly unavailable: string
  readonly offer: string
  readonly realityNote: string
  readonly completed: string
  readonly granted: boolean
}

export const selectServices: (
  state: InvestigationState,
  content: CaseContent,
) => readonly ServiceRow[] = memoBy(
  (s, c) => [s.services, c],
  (state, content) =>
    content.services.map((svc) => ({
      id: svc.id,
      title: svc.title,
      unavailable: svc.unavailable,
      offer: svc.offer,
      realityNote: svc.realityNote,
      completed: svc.completed,
      granted: state.services.includes(svc.id),
    })),
)

// --- Devices ---------------------------------------------------------------

export interface DeviceRow {
  readonly id: string
  readonly kind: 'phone' | 'laptop' | 'drive'
  readonly label: string
  readonly owner: string
  readonly meta: string
  readonly connected: boolean
  readonly unlocked: boolean
  readonly unlockHint: string
}

export const selectDevices: (
  state: InvestigationState,
  content: CaseContent,
) => readonly DeviceRow[] = memoBy(
  (s, c) => [s.devices, c],
  (state, content) =>
    content.devices.map((device) => {
      const held = state.devices[device.id]
      return {
        id: device.id,
        kind: device.kind,
        label: device.label,
        owner: device.owner,
        meta: device.meta,
        connected: held?.connected ?? device.connected,
        unlocked: held?.unlocked ?? device.unlocked,
        unlockHint: device.unlockHint,
      }
    }),
)

/** The phone this case supplies, when it supplies one and the investigator has opened it. */
export function selectPhoneAvailable(state: InvestigationState, content: CaseContent): boolean {
  if (!content.phone) return false
  const phoneDevice = content.devices.find((d) => d.kind === 'phone')
  if (!phoneDevice) return true
  const held = state.devices[phoneDevice.id]
  return Boolean(held?.connected && held?.unlocked)
}

// --- Mail ------------------------------------------------------------------

export interface MailRow extends MailMessage {
  readonly unread: boolean
  readonly selected: boolean
}

const unknownMailDeps = (s: InvestigationState, c: CaseContent) => [
  s.mail.unknownArrived,
  s.mail.readIds,
  s.mail.openId,
  s.claimLog,
  // Exposure and the note length only reach the inbox once the unknown mail has arrived, so
  // before then they must not invalidate it — otherwise typing a note re-renders the mail app.
  s.mail.unknownArrived ? s.exposure : 0,
  s.mail.unknownArrived ? s.notes.trim().length : 0,
  c,
]

export const selectMail: (
  state: InvestigationState,
  content: CaseContent,
) => readonly MailRow[] = memoBy(unknownMailDeps, (state, content) => {
  const list: MailMessage[] = [...content.mail]
  if (state.mail.unknownArrived) {
    const u = content.unknownMail
    const lastOnRecord = state.claimLog[state.claimLog.length - 1]
    const second = lastOnRecord
      ? u.withClaim.replace('{{claim}}', lastOnRecord.claimText)
      : u.withoutClaim
    const body = [u.opening, second]
    // The first line the investigator has earned is the one they get.
    const line = u.exposureLines.find((l) => state.exposure >= l.minExposure)
    if (line) body.push(line.text)
    // Length only. Never a word of what they wrote — that rule holds here as it does in
    // analytics, and it is more frightening this way.
    if (u.notesLine && state.notes.trim().length > 0) {
      body.push(u.notesLine.replace('{{count}}', String(state.notes.length)))
    }
    list.unshift({
      id: u.id,
      from: u.from,
      subject: u.subject,
      time: u.time,
      meta: u.meta,
      body,
      evidenceId: null,
      // The message that arrives at the end disputes nothing; it is the case reporting itself
      // back.
      disputedClaim: null,
    })
  }
  return list.map((m) => ({
    ...m,
    unread: !state.mail.readIds.includes(m.id),
    selected: state.mail.openId === m.id,
  }))
})

export const selectOpenMail: (
  state: InvestigationState,
  content: CaseContent,
) => MailRow | null = memoBy(unknownMailDeps, (state, content) => {
  const list = selectMail(state, content)
  return list.find((m) => m.id === state.mail.openId) ?? list[0] ?? null
})

// --- Messenger -------------------------------------------------------------

/**
 * What the player can say right now. A choice gated on evidence is simply absent until they are
 * holding the thing that lets them ask — you cannot accuse someone of lying before you can prove
 * it, and finding the proof should feel like it opened a door.
 */
export const selectChoices: (
  state: InvestigationState,
  content: CaseContent,
) => readonly Choice[] = memoBy(
  (s, c) => [s.chat.waiting, s.chat.thread, s.chat.step, s.chat.log, s.evidence, c],
  (state, content) => {
    if (state.chat.waiting[state.chat.thread]) return []
    const thread = content.threads.find((t) => t.id === state.chat.thread)
    if (!thread) return []
    if ((state.chat.log[state.chat.thread]?.length ?? 0) === 0) return []
    const node = thread.script[state.chat.step[state.chat.thread] ?? 0]
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
  state: InvestigationState,
  content: CaseContent,
) => readonly SearchResultRow[] = memoBy(
  (s, c) => [s.browser.resultIds, s.flags, c],
  (state, content) => {
    return state.browser.resultIds.flatMap((id) => {
      const entry = content.browser.index.find((e) => e.id === id)
      if (!entry) return []
      const { title, snippet } = resolveSearchEntry(entry, state.flags)
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

export const selectPage: (state: InvestigationState, content: CaseContent) => PageView = memoBy(
  (s, c) => [s.browser.url, s.flags, c],
  (state, content) => {
    const page = findPage(content, state.browser.url)
    if (!page) return { found: false, background: '#fff', dark: false, blocks: [] }
    return {
      found: true,
      background: page.background,
      dark: page.dark,
      blocks: resolveBlocks(page, state.flags),
    }
  },
)

// --- Files -----------------------------------------------------------------

export interface FileRow {
  readonly id: string
  readonly name: string
  readonly icon: CaseContent['files'][number]['icon']
  readonly meta: string
  readonly selected: boolean
}

export const selectFiles: (
  state: InvestigationState,
  content: CaseContent,
) => readonly FileRow[] = memoBy(
  (s, c) => [s.files.decrypted, s.files.openId, s.services, c],
  (state, content) => {
    return content.files
      // A document a forensic service would recover is not on the disk until it has been.
      .filter((f) => !isWithheld(state, content, 'file', f.id))
      .map((f) => ({
        id: f.id,
        name: f.name,
        icon: f.icon,
        meta: state.files.decrypted[f.id] && f.metaWhenDecrypted ? f.metaWhenDecrypted : f.meta,
        selected: state.files.openId === f.id,
      }))
  },
)

export function selectFileBody(state: InvestigationState, content: CaseContent): string {
  const doc = content.files.find((f) => f.id === state.files.openId)
  if (!doc) return ''
  if (state.files.decrypted[doc.id] && doc.bodyWhenDecrypted) return doc.bodyWhenDecrypted
  return doc.body
}

export function selectFileEvidenceId(
  state: InvestigationState,
  content: CaseContent,
): string | null {
  const doc = content.files.find((f) => f.id === state.files.openId)
  if (!doc || !doc.evidenceId) return null
  if (doc.evidenceRequiresDecryption && !state.files.decrypted[doc.id]) return null
  if (isWithheld(state, content, 'evidence', doc.evidenceId)) return null
  return doc.evidenceId
}

// --- Investigation ---------------------------------------------------------

export interface EvidenceCard extends Evidence {
  readonly discoveredAt: number
  readonly selected: boolean
}

export const selectEvidenceCards: (
  state: InvestigationState,
  content: CaseContent,
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

export function isPinned(
  state: InvestigationState,
  evidenceId: string | null | undefined,
): boolean {
  if (!evidenceId) return false
  return state.evidence.some((e) => e.id === evidenceId)
}

export function pinLabel(
  state: InvestigationState,
  evidenceId: string | null | undefined,
): string {
  return isPinned(state, evidenceId) ? 'PINNED' : 'PIN AS EVIDENCE'
}

// --- The report gate -------------------------------------------------------

export function selectCanFileReport(state: InvestigationState, content: CaseContent): boolean {
  return canFileReport(state.beats, content.requiredBeats as readonly BeatId[])
}

export const selectOutstandingBeats: (
  state: InvestigationState,
  content: CaseContent,
) => readonly BeatId[] = memoBy(
  (s, c) => [s.beats, c],
  (state, content) => {
    return outstandingBeats(state.beats, content.requiredBeats as readonly BeatId[])
  },
)

// --- The report ------------------------------------------------------------

export interface ReportSummary {
  readonly timestamp: string
  /** What the investigator actually did, in their own words — authored, never derived. */
  readonly deeds: readonly string[]
  readonly evidenceCount: number
  readonly claimCount: number
  readonly exposure: number
  /** True when a page they read now reads differently. */
  readonly changed: boolean
  readonly watchedLine: string
  readonly exposedLine: string
}

/**
 * A stats screen reports numbers. This reports what the player did — but every word of it is
 * authored in `content.report.deeds`. The engine fills templates; it does not know what opening
 * somebody else's phone means.
 */
function selectDeeds(state: InvestigationState, content: CaseContent): readonly string[] {
  const t = content.report.deeds
  const deeds: string[] = []

  if (state.evidence.length > 0 && t.evidence) {
    deeds.push(t.evidence.replace('{{count}}', String(state.evidence.length)))
  }
  if (state.claimLog.length > 0 && t.claims) {
    deeds.push(t.claims.replace('{{count}}', String(state.claimLog.length)))
  }

  const opened = content.devices.filter((d) => state.devices[d.id]?.unlocked)
  if (opened.length > 0 && t.devices) {
    deeds.push(t.devices.replace('{{names}}', opened.map((d) => d.label).join(', ')))
  }

  // `decrypted` is state rather than a flag, so it is offered to the authored list as one —
  // true when anything at all was opened, which is what the line is about.
  const flags: Record<string, boolean> = {
    ...state.flags,
    decrypted: Object.values(state.files.decrypted).some(Boolean),
  }
  for (const line of t.flagged) {
    if (flags[line.whenFlag]) deeds.push(line.text)
  }

  // Length only. Never a word of it.
  if (state.notes.trim().length > 0 && t.notes) {
    deeds.push(t.notes.replace('{{count}}', String(state.notes.length)))
  }
  // Reaching outside the case file is a deed like any other.
  if (state.relay.kept.length > 0 && t.kept) {
    deeds.push(t.kept.replace('{{count}}', String(state.relay.kept.length)))
  }

  return deeds
}

export const selectReportSummary: (
  state: InvestigationState,
  content: CaseContent,
) => ReportSummary = memoBy(
  (s, c) => [
    s.evidence,
    s.claimLog,
    s.exposure,
    s.devices,
    s.browser.history,
    s.browser.url,
    s.files,
    s.flags,
    s.notes.length,
    s.relay,
    c,
  ],
  (state, content) => {
    const visited = state.browser.history.map((h) => h.url).concat(state.browser.url)
    return {
      timestamp: content.report.timestamp,
      deeds: selectDeeds(state, content),
      evidenceCount: state.evidence.length,
      claimCount: state.claimLog.length,
      exposure: state.exposure,
      changed: hasWitnessedChange(content, visited, state.flags),
      watchedLine: content.report.watchedLine,
      exposedLine: content.report.exposedLine,
    }
  },
)

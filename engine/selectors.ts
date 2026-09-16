import type {
  AudioDoc,
  Block,
  CaseContent,
  Choice,
  DocumentKind,
  MailMessage,
  Photo,
} from './case-schema'
import { clockString, menuBarClock } from './clock'
import { humanSize } from './machine/shell'
import {
  HOME,
  buildFileSystem,
  listing,
  volumes,
  type FileSystem,
  type VfsNode,
  type VfsNodeType,
} from './machine/vfs'
import { findPage, hasWitnessedChange, resolveBlocks, resolveSearchEntry } from './pages'
import { canFileReport, outstandingBeats, photoAvailable, phoneDeviceId } from './rules'
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
  readonly kind: DocumentKind
  readonly meta: string
  readonly selected: boolean
  /** Where it is. The row's identity for navigation, and what a breadcrumb is built from. */
  readonly path: string
  readonly type: VfsNodeType
  readonly locked: boolean
  readonly fileId: string | null
  readonly photoId: string | null
}

/**
 * The machine's filesystem, as this investigation currently has it.
 *
 * Memoised on what can actually change it — which sources are open, which recoveries have been
 * granted, and the case — so the file manager, the shell and Quick Look all read one tree built
 * once rather than three trees built per render.
 */
export const selectFileSystem: (
  state: InvestigationState,
  content: CaseContent,
) => FileSystem = memoBy(
  (s, c) => [s.devices, s.services, c],
  (state, content) => buildFileSystem(state, content),
)

/**
 * What is in the directory the file manager is showing.
 *
 * A row is a node of the tree, not a document the case authored: a folder is a row, a volume is
 * a row, and a picture on somebody's camera roll is a row. What it means to open one is the
 * caller's problem.
 */
export const selectFiles: (
  state: InvestigationState,
  content: CaseContent,
) => readonly FileRow[] = memoBy(
  (s, c) => [s.files.decrypted, s.files.openId, s.files.cwd, s.devices, s.services, c],
  (state, content) => {
    const fs = selectFileSystem(state, content)
    return listing(fs, state.files.cwd).map((node) => {
      const doc = node.fileId ? content.files.find((f) => f.id === node.fileId) : undefined
      const decrypted = doc ? Boolean(state.files.decrypted[doc.id]) : false
      return {
        id: node.fileId ?? node.photoId ?? node.path,
        path: node.path,
        name: node.name,
        type: node.type,
        locked: node.locked,
        fileId: node.fileId,
        photoId: node.photoId,
        kind: doc ? documentKind(state, doc) : node.photoId ? 'scan' : 'note',
        meta: rowMeta(node, doc, decrypted),
        selected: node.fileId !== null && state.files.openId === node.fileId,
      }
    })
  },
)

/** The line on the right of a row: the case's own words for a document, the machine's for the rest. */
function rowMeta(
  node: VfsNode,
  doc: CaseContent['files'][number] | undefined,
  decrypted: boolean,
): string {
  if (doc) return decrypted && doc.metaWhenDecrypted ? doc.metaWhenDecrypted : doc.meta
  if (node.type === 'volume') return node.locked ? 'locked' : `${node.owner} · read-only`
  if (node.type === 'directory') return ''
  return [humanSize(node.size), node.modified].filter(Boolean).join(' · ')
}

/** The places sidebar: the investigator's own folders, then whatever is attached. */
export const selectPlaces: (
  state: InvestigationState,
  content: CaseContent,
) => readonly { name: string; path: string; locked: boolean }[] = memoBy(
  (s, c) => [s.devices, s.services, c],
  (state, content) => {
    const fs = selectFileSystem(state, content)
    const home = listing(fs, HOME).map((node) => ({
      name: node.name,
      path: node.path,
      locked: false,
    }))
    const attached = volumes(fs).map((node) => ({
      name: node.name,
      path: node.path,
      locked: node.locked,
    }))
    return [...home, ...attached]
  },
)

/**
 * One document, resolved.
 *
 * Every surface that shows a document — the reader in Files, Quick Look, the desktop — asks for
 * this and renders it. A component that reached into `content.files` itself would be deciding,
 * on its own, whether a sealed file has been opened yet.
 */
export interface DocumentModel {
  readonly id: string
  readonly name: string
  readonly kind: DocumentKind
  readonly meta: string
  readonly body: string
  readonly audio: AudioDoc | null
  /** Sealed, and not yet opened. What it will turn out to be is not shown. */
  readonly sealed: boolean
  /** The pin, when this document is offering one *now*. */
  readonly evidenceId: string | null
}

function documentKind(
  state: InvestigationState,
  doc: CaseContent['files'][number],
): DocumentKind {
  if (state.files.decrypted[doc.id] && doc.kindWhenDecrypted) return doc.kindWhenDecrypted
  return doc.kind
}

export function selectDocument(
  state: InvestigationState,
  content: CaseContent,
  fileId: string,
): DocumentModel | null {
  const doc = content.files.find((f) => f.id === fileId)
  if (!doc) return null
  if (isWithheld(state, content, 'file', doc.id)) return null
  const open = Boolean(state.files.decrypted[doc.id])
  return {
    id: doc.id,
    name: doc.name,
    kind: documentKind(state, doc),
    meta: open && doc.metaWhenDecrypted ? doc.metaWhenDecrypted : doc.meta,
    body: open && doc.bodyWhenDecrypted ? doc.bodyWhenDecrypted : doc.body,
    audio: doc.audio,
    sealed: doc.kind === 'encrypted' && !open,
    evidenceId: fileEvidenceId(state, content, doc, open),
  }
}

/**
 * Memoised, like every selector that builds an object.
 *
 * A component reading this through `useSyncExternalStore` compares by identity: handing it a
 * fresh `DocumentModel` on every render is not a slow render, it is an infinite one.
 */
export const selectOpenDocument: (
  state: InvestigationState,
  content: CaseContent,
) => DocumentModel | null = memoBy(
  (s, c) => [s.files.openId, s.files.decrypted, s.services, c],
  (state, content) => selectDocument(state, content, state.files.openId),
)

function fileEvidenceId(
  state: InvestigationState,
  content: CaseContent,
  doc: CaseContent['files'][number],
  decrypted: boolean,
): string | null {
  if (!doc.evidenceId) return null
  if (doc.evidenceRequiresDecryption && !decrypted) return null
  if (isWithheld(state, content, 'evidence', doc.evidenceId)) return null
  return doc.evidenceId
}

// --- Photographs -----------------------------------------------------------

export interface PhotoRow {
  readonly id: string
  readonly label: string
  readonly meta: string
  readonly subject: Photo['subject']
  readonly selected: boolean
  readonly evidenceId: string | null
}

export interface PhotoModel extends PhotoRow {
  readonly detail: readonly string[]
  /** The source it came off, named the way the case names it. */
  readonly source: string
}

function photoRow(state: InvestigationState, photo: Photo): PhotoRow {
  return {
    id: photo.id,
    label: photo.label,
    meta: photo.meta,
    subject: photo.subject,
    selected: state.media.openPhotoId === photo.id,
    evidenceId: photo.evidenceId,
  }
}

/** The contact sheet: everything this machine has extracted from a source it can read. */
export const selectPhotos: (
  state: InvestigationState,
  content: CaseContent,
) => readonly PhotoRow[] = memoBy(
  (s, c) => [s.devices, s.media.openPhotoId, c],
  (state, content) =>
    content.photos
      .filter((photo) => photoAvailable(photo, state.devices))
      .map((photo) => photoRow(state, photo)),
)

/**
 * The roll on the handset itself.
 *
 * The same photographs, reached the other way round — the player holding the phone sees what is
 * on the phone, and the same file in the workstation's viewer carries the extraction notes the
 * handset would never show. One set of pictures, two surfaces, no second copy.
 */
export const selectPhonePhotos: (
  state: InvestigationState,
  content: CaseContent,
) => readonly PhotoRow[] = memoBy(
  (s, c) => [s.devices, s.media.openPhotoId, c],
  (state, content) => {
    const device = phoneDeviceId(content)
    if (!device) return []
    return content.photos
      .filter((photo) => photo.sourceId === device && photoAvailable(photo, state.devices))
      .map((photo) => photoRow(state, photo))
  },
)

export function selectPhoto(
  state: InvestigationState,
  content: CaseContent,
  photoId: string,
): PhotoModel | null {
  const photo = content.photos.find((p) => p.id === photoId)
  if (!photo || !photoAvailable(photo, state.devices)) return null
  const device = photo.sourceId ? content.devices.find((d) => d.id === photo.sourceId) : null
  return {
    ...photoRow(state, photo),
    detail: photo.detail,
    source: device ? device.label : 'Supplied with the case',
  }
}

export const selectOpenPhoto: (
  state: InvestigationState,
  content: CaseContent,
) => PhotoModel | null = memoBy(
  (s, c) => [s.media.openPhotoId, s.devices, c],
  (state, content) => {
    const open = selectPhoto(state, content, state.media.openPhotoId)
    if (open) return open
    // A locked source, or a case whose first picture is behind one: fall to the first readable
    // frame rather than showing the viewer an empty pane it cannot explain.
    const first = selectPhotos(state, content)[0]
    return first ? selectPhoto(state, content, first.id) : null
  },
)

// --- Quick Look ------------------------------------------------------------

export type QuickLookModel =
  | { readonly kind: 'file'; readonly document: DocumentModel }
  | { readonly kind: 'photo'; readonly photo: PhotoModel }

/** What Space is holding up, or `null` — including when what it held has since been withheld. */
export const selectQuickLook: (
  state: InvestigationState,
  content: CaseContent,
) => QuickLookModel | null = memoBy(
  (s, c) => [s.ui.quickLook, s.files.decrypted, s.services, s.devices, s.media.openPhotoId, c],
  (state, content) => {
    const ref = state.ui.quickLook
    if (!ref) return null
    if (ref.kind === 'file') {
      const document = selectDocument(state, content, ref.id)
      return document ? { kind: 'file', document } : null
    }
    const photo = selectPhoto(state, content, ref.id)
    return photo ? { kind: 'photo', photo } : null
  },
)

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

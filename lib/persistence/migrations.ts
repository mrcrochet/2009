import { SCHEMA_VERSION } from '@/engine/types'
import type { StoredTimeline } from './types'

/**
 * Every timeline carries a `schemaVersion` and passes through here on load. A migration that
 * cannot run quarantines the row rather than crashing a player's session.
 */

type AnyRecord = Record<string, unknown>

interface MigrationStep {
  readonly from: number
  readonly to: number
  readonly describe: string
  migrate(row: AnyRecord): AnyRecord
}

const STEPS: readonly MigrationStep[] = [
  {
    from: 1,
    to: 2,
    describe: 'add heat + divergence to the snapshot',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      if (typeof snapshot.heat !== 'number') snapshot.heat = 0
      if (typeof snapshot.divergence !== 'number') snapshot.divergence = 0
      return { ...row, snapshot }
    },
  },
  {
    from: 2,
    to: 3,
    describe: 'give the browser a real back-stack and windows a zoom/minimize flag',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const browser = { ...((snapshot.browser as AnyRecord) ?? {}) }
      if (!Array.isArray(browser.history)) browser.history = []
      if (!Array.isArray(browser.resultIds)) browser.resultIds = []
      snapshot.browser = browser
      const windows = Array.isArray(snapshot.windows) ? (snapshot.windows as AnyRecord[]) : []
      snapshot.windows = windows.map((w) => ({
        minimized: false,
        zoomed: false,
        ...w,
      }))
      return { ...row, snapshot }
    },
  },
  {
    from: 3,
    to: 4,
    describe: 'give the browser a forward stack',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const browser = { ...((snapshot.browser as AnyRecord) ?? {}) }
      if (!Array.isArray(browser.forward)) browser.forward = []
      snapshot.browser = browser
      return { ...row, snapshot }
    },
  },
  {
    from: 4,
    to: 5,
    describe: 'dialogue choices carry their own reply',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const chat = { ...((snapshot.chat as AnyRecord) ?? {}) }
      if (chat.pendingReply === undefined) chat.pendingReply = null
      if (typeof chat.pendingAdvance !== 'boolean') chat.pendingAdvance = true
      snapshot.chat = chat
      return { ...row, snapshot }
    },
  },
  {
    from: 5,
    to: 6,
    describe: 'Quoteline keeps a watchlist',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      if (!Array.isArray(snapshot.watchlist)) snapshot.watchlist = []
      return { ...row, snapshot }
    },
  },
  {
    from: 6,
    to: 7,
    describe: 'the chat pending-reply state is per thread',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const chat = { ...((snapshot.chat as AnyRecord) ?? {}) }
      const threads = ['unknown', 'marc', 'lea'] as const
      const spread = <T>(value: T) => Object.fromEntries(threads.map((t) => [t, value]))
      if (typeof chat.waiting !== 'object' || chat.waiting === null) {
        chat.waiting = spread(chat.waiting === true)
      }
      if (typeof chat.pendingReply !== 'object' || chat.pendingReply === null) {
        chat.pendingReply = spread(null)
      }
      if (typeof chat.pendingAdvance !== 'object' || chat.pendingAdvance === null) {
        chat.pendingAdvance = spread(true)
      }
      snapshot.chat = chat
      return { ...row, snapshot }
    },
  },
  {
    from: 7,
    to: 8,
    describe: 'the address bar is a draft, separate from the location',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const browser = { ...((snapshot.browser as AnyRecord) ?? {}) }
      if (browser.draftUrl === undefined) browser.draftUrl = null
      snapshot.browser = browser
      return { ...row, snapshot }
    },
  },
  {
    from: 8,
    to: 9,
    describe: 'evidence is namespaced by the day it was found on',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const day = typeof snapshot.day === 'number' ? snapshot.day : 1
      const evidence = Array.isArray(snapshot.evidence) ? (snapshot.evidence as AnyRecord[]) : []
      snapshot.evidence = evidence.map((e) => ({
        ...e,
        day: typeof e.day === 'number' ? e.day : day,
        id: typeof e.id === 'string' && !e.id.includes(':') ? `${day}:${e.id}` : e.id,
      }))
      const selected = Array.isArray(snapshot.selectedEvidenceIds)
        ? (snapshot.selectedEvidenceIds as string[])
        : []
      snapshot.selectedEvidenceIds = selected.map((id) => (id.includes(':') ? id : `${day}:${id}`))
      return { ...row, snapshot }
    },
  },
  {
    from: 9,
    to: 10,
    describe: 'the timeline remembers what the relay showed it',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const wayup = { ...((snapshot.wayup as AnyRecord) ?? {}) }
      if (typeof wayup.unlocked !== 'boolean') wayup.unlocked = false
      if (!Array.isArray(wayup.observed)) wayup.observed = []
      if (!Array.isArray(wayup.futureEvidence)) wayup.futureEvidence = []
      if (!Array.isArray(wayup.mysteries)) wayup.mysteries = []
      if (typeof wayup.signalSpent !== 'number') wayup.signalSpent = 0
      snapshot.wayup = wayup
      return { ...row, snapshot }
    },
  },
  {
    from: 10,
    to: 11,
    describe: 'the timeline records which of the world it has actually met',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      if (!Array.isArray(snapshot.discovered)) snapshot.discovered = []
      return { ...row, snapshot }
    },
  },
  {
    from: 11,
    to: 12,
    describe: 'decryption is remembered per file, not once for the whole machine',
    migrate(row) {
      const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
      const files = { ...((snapshot.files as AnyRecord) ?? {}) }
      // The only encrypted file that existed under the old shape was Day 01's. A save that had
      // it open keeps it open, and one that burned attempts keeps having burned them — against
      // that file, and no longer against every file authored since.
      if (typeof files.decrypted === 'boolean') {
        files.decrypted = files.decrypted ? { enc: true } : {}
      }
      if (typeof files.decryptAttempts === 'number') {
        files.decryptAttempts = files.decryptAttempts > 0 ? { enc: files.decryptAttempts } : {}
      }
      if (typeof files.decrypted !== 'object' || files.decrypted === null) files.decrypted = {}
      if (typeof files.decryptAttempts !== 'object' || files.decryptAttempts === null) {
        files.decryptAttempts = {}
      }
      snapshot.files = files

      // A line kept from the far side now records where it came from. A save written before
      // that has snapshot ids and nothing to label them with, which is what the empty string is.
      const wayup = { ...((snapshot.wayup as AnyRecord) ?? {}) }
      const future = Array.isArray(wayup.futureEvidence)
        ? (wayup.futureEvidence as AnyRecord[])
        : []
      wayup.futureEvidence = future.map((e) => ({
        ...e,
        sourceUrl: typeof e.sourceUrl === 'string' ? e.sourceUrl : '',
        sourceTitle: typeof e.sourceTitle === 'string' ? e.sourceTitle : '',
      }))
      snapshot.wayup = wayup

      // The relay console is a screen the timeline can be sitting on, so it needs a place in
      // the saved shape. A save from before it existed was never on it.
      const ui = { ...((snapshot.ui as AnyRecord) ?? {}) }
      if (typeof ui.wayupOpen !== 'boolean') ui.wayupOpen = false
      snapshot.ui = ui

      // And an item now records the day it was bought, so the card printed on the twentieth is
      // about the twentieth. Everything already held was bought on the day the save is on.
      const day = typeof snapshot.day === 'number' ? snapshot.day : 1
      const inventory = Array.isArray(snapshot.inventory) ? (snapshot.inventory as AnyRecord[]) : []
      snapshot.inventory = inventory.map((i) => ({
        ...i,
        day: typeof i.day === 'number' ? i.day : day,
      }))

      return { ...row, snapshot }
    },
  },
]

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly timelineId: string | null,
    readonly fromVersion: number,
  ) {
    super(message)
    this.name = 'MigrationError'
  }
}

export function migrateStored(raw: unknown): StoredTimeline {
  if (!raw || typeof raw !== 'object') {
    throw new MigrationError('save is not an object', null, -1)
  }
  let row = { ...(raw as AnyRecord) }
  const id = typeof row.id === 'string' ? row.id : null
  let version = typeof row.schemaVersion === 'number' ? row.schemaVersion : 1

  if (version > SCHEMA_VERSION) {
    throw new MigrationError(
      `save was written by a newer build (v${version} > v${SCHEMA_VERSION})`,
      id,
      version,
    )
  }

  let guard = 0
  while (version < SCHEMA_VERSION) {
    const step = STEPS.find((s) => s.from === version)
    if (!step) throw new MigrationError(`no migration from v${version}`, id, version)
    row = step.migrate(row)
    version = step.to
    if ((guard += 1) > 64) throw new MigrationError('migration loop', id, version)
  }

  row.schemaVersion = SCHEMA_VERSION
  const snapshot = { ...((row.snapshot as AnyRecord) ?? {}) }
  snapshot.schemaVersion = SCHEMA_VERSION
  row.snapshot = snapshot
  if (!Array.isArray(row.events)) row.events = []

  return row as unknown as StoredTimeline
}

export function migrationSteps(): readonly { from: number; to: number; describe: string }[] {
  return STEPS.map(({ from, to, describe }) => ({ from, to, describe }))
}

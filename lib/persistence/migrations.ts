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

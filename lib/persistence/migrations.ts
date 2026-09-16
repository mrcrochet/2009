import { SCHEMA_VERSION } from '@/engine/types'
import type { StoredInvestigation } from './types'

/**
 * Every investigation carries a `schemaVersion` and passes through here on load. A migration
 * that cannot run quarantines the row rather than crashing a player's session.
 */

type AnyRecord = Record<string, unknown>

interface MigrationStep {
  readonly from: number
  readonly to: number
  readonly describe: string
  migrate(row: AnyRecord): AnyRecord
}

/**
 * The chain.
 *
 * It starts at 13, and that is the honest answer rather than a gap. Versions 1 to 12 were saves
 * of a different game: a day of thirty, a cash balance in cents, a memory-coherence score. There
 * is no function from those to an investigation on a case — a `day: 4` does not become a case,
 * and inventing one would hand a player a file they never built. Such a save reaches
 * `migrateStored`, finds no step, and is quarantined by the loader, which is what should happen
 * to a save of a product that no longer exists.
 *
 * From 13 the chain is real, because from 13 the saves are this product's.
 */
const STEPS: readonly MigrationStep[] = [
  {
    from: 13,
    to: 14,
    describe: 'adds the photo viewer and Quick Look to the surface of the machine',
    /**
     * Both fields are surface, not investigation: which frame the viewer is on and what is being
     * held up to the light. A session written before either existed had no frame selected and
     * nothing held up, so the defaults *are* that session — nothing is invented, and nothing the
     * report would ever cite is touched.
     */
    migrate(row) {
      const snapshot = asRecord(row.snapshot)
      if (!snapshot) return row
      const ui = asRecord(snapshot.ui) ?? {}
      return {
        ...row,
        snapshot: {
          ...snapshot,
          media: asRecord(snapshot.media) ?? { openPhotoId: '' },
          ui: { ...ui, quickLook: ui.quickLook ?? null },
        },
      }
    },
  },
]

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : null
}

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly investigationId: string | null,
    readonly fromVersion: number,
  ) {
    super(message)
    this.name = 'MigrationError'
  }
}

export function migrateStored(raw: unknown): StoredInvestigation {
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

  return row as unknown as StoredInvestigation
}

export function migrationSteps(): readonly { from: number; to: number; describe: string }[] {
  return STEPS.map(({ from, to, describe }) => ({ from, to, describe }))
}

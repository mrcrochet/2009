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
  {
    from: 14,
    to: 15,
    describe: 'makes the relay an application and gives every capture its provenance',
    /**
     * Three changes, and only one of them can lose anything.
     *
     * `relay.observed` was a list of snapshot ids. `relay.captures` is the same list with where
     * each page came from and what the look cost — which a v14 save never recorded, so those
     * fields come across as `null` and `0`. That is the honest shape for "this build did not
     * keep it": the ids still make reopening free, and the list says so rather than inventing an
     * address.
     *
     * `ui.relayOpen` is gone because the console is a window now, and `RELAY_TOGGLED` with it.
     * The event has to be dropped from the log rather than left in: the log is validated against
     * a closed vocabulary, and a save carrying a type this build has retired would be refused
     * at the door.
     */
    migrate(row) {
      const snapshot = asRecord(row.snapshot)
      if (!snapshot) return row
      const relay = asRecord(snapshot.relay) ?? {}
      const ui = asRecord(snapshot.ui) ?? {}
      const { relayOpen: _relayOpen, ...restUi } = ui
      const observed = Array.isArray(relay.observed) ? relay.observed : []
      const { observed: _observed, ...restRelay } = relay
      const events = Array.isArray(row.events) ? row.events : []

      return {
        ...row,
        events: events.filter((event) => !(asRecord(event)?.type === 'RELAY_TOGGLED')),
        snapshot: {
          ...snapshot,
          ui: restUi,
          relay: {
            ...restRelay,
            captures: Array.isArray(relay.captures)
              ? relay.captures
              : observed
                  .filter((id): id is string => typeof id === 'string')
                  .map((id) => ({ snapshotId: id, url: null, title: null, cost: 0, at: 0 })),
          },
        },
      }
    },
  },
  {
    from: 15,
    to: 16,
    describe: 'turns the handset from three tabs into a device with a route stack',
    /**
     * `phone.tab` was one of three panels. A handset is a place you go into and come back out
     * of, so it carries a stack now — and a save written mid-tab becomes a save with that
     * application open, which is what the player was in fact looking at.
     *
     * `PHONE_TAB_CHANGED` leaves the log for the same reason `RELAY_TOGGLED` did: the vocabulary
     * is closed, and a retired type would be refused at the door rather than migrated.
     */
    migrate(row) {
      const snapshot = asRecord(row.snapshot)
      if (!snapshot) return row
      const phone = asRecord(snapshot.phone) ?? {}
      const { tab, ...rest } = phone
      const app = tab === 'photos' ? 'photos' : tab === 'contacts' ? 'contacts' : 'messages'
      const events = Array.isArray(row.events) ? row.events : []

      return {
        ...row,
        events: events.filter((event) => asRecord(event)?.type !== 'PHONE_TAB_CHANGED'),
        snapshot: {
          ...snapshot,
          phone: {
            ...rest,
            route: Array.isArray(phone.route)
              ? phone.route
              : phone.open
                ? [{ app, item: null }]
                : [],
            readNotifications: Array.isArray(phone.readNotifications)
              ? phone.readNotifications
              : [],
            passcodeAttempts:
              typeof phone.passcodeAttempts === 'number' ? phone.passcodeAttempts : 0,
          },
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

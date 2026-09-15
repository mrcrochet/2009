import { describe, expect, it } from 'vitest'
import { MigrationError, migrateStored, migrationSteps } from '@/lib/persistence/migrations'
import { fromStored, toStored } from '@/lib/persistence/types'
import { SCHEMA_VERSION } from '@/engine/types'
import { fresh } from './helpers'

describe('save migration', () => {
  it('round-trips a current save', () => {
    const state = fresh()
    const stored = toStored(state)
    const back = fromStored(migrateStored(stored))
    expect(back.id).toBe(state.id)
    expect(back.caseId).toBe(state.caseId)
    expect(back.schemaVersion).toBe(SCHEMA_VERSION)
  })

  /**
   * A save of the old game is not an old save of this one.
   *
   * There is no function from "day 4 of thirty, $717.82, 91% coherence" to an investigation on a
   * case. Reshaping one would hand a player a file they never built, so it is refused and the
   * loader quarantines it.
   */
  it('refuses a save from the game this product used to be', () => {
    for (const version of [1, 7, 12]) {
      expect(() =>
        migrateStored({ id: 'x', schemaVersion: version, snapshot: { day: 4 }, events: [] }),
      ).toThrow(MigrationError)
    }
  })

  it('refuses a save from a newer build rather than corrupting it', () => {
    expect(() => migrateStored({ id: 'x', schemaVersion: 999, snapshot: {}, events: [] })).toThrow(
      MigrationError,
    )
  })

  it('refuses junk', () => {
    expect(() => migrateStored(null)).toThrow(MigrationError)
    expect(() => migrateStored('not a save')).toThrow(MigrationError)
  })

  it('has a contiguous migration chain up to the current version', () => {
    const steps = migrationSteps()
    let version = steps[0]?.from ?? SCHEMA_VERSION
    for (const step of steps) {
      expect(step.from).toBe(version)
      version = step.to
    }
    expect(version).toBe(SCHEMA_VERSION)
  })
})

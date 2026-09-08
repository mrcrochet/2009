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
    expect(back.cashCents).toBe(state.cashCents)
    expect(back.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('migrates a v1 save forward without losing anything', () => {
    const state = fresh()
    const stored = toStored(state)
    const legacy = JSON.parse(JSON.stringify(stored)) as Record<string, unknown>
    legacy.schemaVersion = 1
    const snapshot = legacy.snapshot as Record<string, unknown>
    delete snapshot.heat
    delete snapshot.divergence
    delete (snapshot.browser as Record<string, unknown>).history
    delete (snapshot.browser as Record<string, unknown>).forward
    snapshot.windows = [{ app: 'mail', x: 10, y: 20, z: 21 }]

    const migrated = migrateStored(legacy)
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION)
    const back = fromStored(migrated)
    expect(back.heat).toBe(0)
    expect(back.divergence).toBe(0)
    expect(back.browser.history).toEqual([])
    expect(back.browser.forward).toEqual([])
    expect(back.windows[0]).toMatchObject({ app: 'mail', x: 10, y: 20, minimized: false, zoomed: false })
    expect(back.cashCents).toBe(state.cashCents)
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

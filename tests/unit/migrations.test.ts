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

  /**
   * The first real migration this product has had. A v13 save was written before the machine had
   * a photo viewer or a way to hold a document up, so the defaults *are* that session — and
   * nothing a filed report would cite is touched on the way through.
   */
  it('carries a save written before the viewer and Quick Look existed', () => {
    const current = toStored(fresh())
    const old = {
      ...current,
      schemaVersion: 13,
      snapshot: (() => {
        const { media: _media, ...rest } = current.snapshot as Record<string, unknown> & {
          ui: Record<string, unknown>
        }
        const { quickLook: _quickLook, ...ui } = rest.ui
        return { ...rest, schemaVersion: 13, ui }
      })(),
    }

    const back = fromStored(migrateStored(old))
    expect(back.schemaVersion).toBe(SCHEMA_VERSION)
    expect(back.media).toEqual({ openPhotoId: '' })
    expect(back.ui.quickLook).toBeNull()
    expect(back.evidence).toEqual(current.snapshot.evidence)
    expect(back.notes).toBe(current.snapshot.notes)
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

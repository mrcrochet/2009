import { describe, expect, it } from 'vitest'
import { StoredInvestigationSchema, InvestigationStateSchema } from '@/engine/investigation-schema'
import { GAME_EVENT_TYPES, isKnownEventType } from '@/engine/events'
import { reduce } from '@/engine/reducer'
import { toStored } from '@/lib/persistence/types'
import type { GameEvent } from '@/engine/types'
import { content, fresh, run } from './helpers'

/**
 * This schema is the only thing between a handwritten JSON body and a jsonb column. The engine's
 * types vanish at compile time; these tests are what make them mean something at the boundary.
 */
describe('investigation validation', () => {
  const played = run(fresh(), [
    { type: 'APP_OPENED', app: 'web' },
    { type: 'BROWSER_SEARCHED', query: 'vale' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
    { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
    { type: 'NOTES_CHANGED', value: 'the receipt says the ninth' },
  ])

  it('accepts a real save', () => {
    expect(InvestigationStateSchema.safeParse({ ...played, eventLog: undefined }).success).toBe(true)
    expect(StoredInvestigationSchema.safeParse(toStored(played)).success).toBe(true)
  })

  it('rejects values outside the ranges that mean something', () => {
    for (const patch of [
      { exposure: -1 },
      { minute: -5 },
      { minute: 99_999 },
      { stage: 'omniscient' as never },
      { caseId: '' },
    ]) {
      const forged = { ...toStored(played) }
      forged.snapshot = { ...forged.snapshot, ...patch }
      expect(StoredInvestigationSchema.safeParse(forged).success, JSON.stringify(patch)).toBe(false)
    }
  })

  /**
   * A forged service list buys nothing.
   *
   * The schema accepts it, deliberately: the grant is the server's and the content behind it is
   * served rather than unlocked here. What the schema must not do is reject an honest save for
   * carrying the projection — that would make a paid-for recovery unloadable.
   */
  it('accepts the service projection without treating it as a grant', () => {
    const forged = { ...toStored(played) }
    forged.snapshot = { ...forged.snapshot, services: ['svc-calls', 'svc-invented'] }
    expect(StoredInvestigationSchema.safeParse(forged).success).toBe(true)
  })

  it('rejects a note used as a file host', () => {
    const forged = { ...toStored(played) }
    forged.snapshot = { ...forged.snapshot, notes: 'x'.repeat(20_001) }
    expect(StoredInvestigationSchema.safeParse(forged).success).toBe(false)
  })

  it('rejects an event vocabulary the engine does not have', () => {
    const forged = toStored(played)
    const bad = { ...forged, events: [...forged.events, { type: 'GRANT_ME_EVERYTHING', at: 500 }] }
    expect(StoredInvestigationSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a save claiming a schema version from the future', () => {
    const forged = { ...toStored(played), schemaVersion: 99 }
    expect(StoredInvestigationSchema.safeParse(forged).success).toBe(false)
  })

  it('knows every event type the engine can produce', () => {
    const produced = new Set(played.eventLog.map((e) => e.type))
    for (const type of produced) expect(isKnownEventType(type)).toBe(true)
    expect(new Set(GAME_EVENT_TYPES).size).toBe(GAME_EVENT_TYPES.length)
  })

  it('an event the engine does not understand leaves the investigation alone', () => {
    const before = fresh()
    const rogue = { type: 'GRANT_ME_EVERYTHING', at: 12 } as unknown as GameEvent
    expect(reduce(before, rogue, content)).toBe(before)
  })
})

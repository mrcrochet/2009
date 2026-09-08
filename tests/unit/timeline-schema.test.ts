import { describe, expect, it } from 'vitest'
import { StoredTimelineSchema, TimelineStateSchema } from '@/engine/timeline-schema'
import { GAME_EVENT_TYPES, isKnownEventType } from '@/engine/events'
import { reduce } from '@/engine/reducer'
import { toStored } from '@/lib/persistence/types'
import type { GameEvent } from '@/engine/types'
import { content, fresh, run } from './helpers'

/**
 * This schema is the only thing between a handwritten JSON body and a jsonb column. The engine's
 * types vanish at compile time; these tests are what make them mean something at the boundary.
 */
describe('timeline validation', () => {
  const played = run(fresh(), [
    { type: 'APP_OPENED', app: 'web' },
    { type: 'BROWSER_SEARCHED', query: 'rask' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
    { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'n90' },
    { type: 'NOTES_CHANGED', value: 'he died on the 19th' },
  ])

  it('accepts a real save', () => {
    expect(TimelineStateSchema.safeParse({ ...played, eventLog: undefined }).success).toBe(true)
    expect(StoredTimelineSchema.safeParse(toStored(played)).success).toBe(true)
  })

  it('rejects money that is not integer cents', () => {
    const forged = { ...toStored(played) }
    forged.snapshot = { ...forged.snapshot, cashCents: 437.82 }
    expect(StoredTimelineSchema.safeParse(forged).success).toBe(false)
  })

  it('rejects coherence outside its range and a day beyond the season', () => {
    for (const patch of [{ memoryIntegrity: 400 }, { memoryIntegrity: -1 }, { day: 999 }]) {
      const forged = { ...toStored(played) }
      forged.snapshot = { ...forged.snapshot, ...patch }
      expect(StoredTimelineSchema.safeParse(forged).success, JSON.stringify(patch)).toBe(false)
    }
  })

  it('rejects a note used as a file host', () => {
    const forged = { ...toStored(played) }
    forged.snapshot = { ...forged.snapshot, notes: 'x'.repeat(20_001) }
    expect(StoredTimelineSchema.safeParse(forged).success).toBe(false)
  })

  it('rejects an event vocabulary the engine does not have', () => {
    const forged = toStored(played)
    const bad = { ...forged, events: [...forged.events, { type: 'GRANT_ME_EVERYTHING', at: 500 }] }
    expect(StoredTimelineSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a save claiming a schema version from the future', () => {
    const forged = { ...toStored(played), schemaVersion: 99 }
    expect(StoredTimelineSchema.safeParse(forged).success).toBe(false)
  })

  it('knows every event type the engine can produce', () => {
    const produced = new Set(played.eventLog.map((e) => e.type))
    for (const type of produced) expect(isKnownEventType(type)).toBe(true)
    expect(new Set(GAME_EVENT_TYPES).size).toBe(GAME_EVENT_TYPES.length)
  })

  it('an event the engine does not understand leaves the timeline alone', () => {
    const before = fresh()
    const rogue = { type: 'GRANT_ME_EVERYTHING', at: 452 } as unknown as GameEvent
    expect(reduce(before, rogue, content)).toBe(before)
  })
})

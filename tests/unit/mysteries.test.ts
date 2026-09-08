import { describe, expect, it } from 'vitest'
import { MysterySchema } from '@/engine/mystery-schema'
import { MYSTERIES, mysteryById } from '@/content/mysteries'
import { isUnlocked, signalRemaining, unlockedMysteries, unmetConditions } from '@/engine/mysteries'
import { content, dispatch, fresh, run } from './helpers'

const ctx = (state: ReturnType<typeof fresh>, globallyUnlocked: string[] = []) => ({
  state,
  globallyUnlocked: new Set(globallyUnlocked),
})

/**
 * The editorial framework, enforced. A mystery that names a real person or claims a historical
 * basis it cannot cite fails here rather than in a review someone was too busy to do carefully.
 */
describe('the editorial line', () => {
  it.each(MYSTERIES.map((m) => [m.id, m] as const))('%s declares its clearance', (_id, mystery) => {
    expect(mystery.legal.realPersons).toBe(false)
    expect(mystery.legal.copiedAssets).toBe(false)
  })

  it('a mystery claiming history must cite where it can be checked', () => {
    const unsourced = {
      ...MYSTERIES[0]!,
      legal: { ...MYSTERIES[0]!.legal, mode: 'historical' as const, sources: [] },
    }
    expect(MysterySchema.safeParse(unsourced).success).toBe(false)
  })

  it('a mystery borrowing a shape must name what it borrowed from', () => {
    const unattributed = {
      ...MYSTERIES[0]!,
      legal: {
        ...MYSTERIES[0]!.legal,
        mode: 'fictionalized' as const,
        structuralInspiration: null,
      },
    }
    expect(MysterySchema.safeParse(unattributed).success).toBe(false)
  })

  it('nothing can declare that it reproduces someone else’s work', () => {
    const copied = { ...MYSTERIES[0]!, legal: { ...MYSTERIES[0]!.legal, copiedAssets: true } }
    expect(MysterySchema.safeParse(copied).success).toBe(false)
  })

  it('there is no mode meaning “adapts a real unsolved case”', () => {
    // The cases with the best structure are the ones entangled with real deaths, real crimes and
    // unproven accusations about real people. The schema does not offer the option.
    const adapted = { ...MYSTERIES[0]!, legal: { ...MYSTERIES[0]!.legal, mode: 'real_case' } }
    expect(MysterySchema.safeParse(adapted).success).toBe(false)
  })

  it('reports how many mysteries lean on a human sign-off', () => {
    // A growing number here is a smell, not a pass.
    const reviewed = MYSTERIES.filter((m) => m.legal.reviewed)
    expect(reviewed.length).toBeLessThanOrEqual(Math.ceil(MYSTERIES.length / 2))
  })

  it('a mystery leaves the player holding something', () => {
    for (const m of MYSTERIES) {
      expect(m.leavesOpen.length, m.id).toBeGreaterThan(40)
      expect(m.global?.resolution ?? 'x').not.toMatch(/\b(coins?|points?|rewards?|xp)\b/i)
    }
  })

  it('the expensive end of the signal scale stays rare', () => {
    // 10–12 is the world-level anomaly. A day that spends it on something ordinary has spent the
    // word's meaning with it.
    const expensive = MYSTERIES.filter((m) => m.signalCost >= 10)
    expect(expensive.length).toBeLessThanOrEqual(1)
  })

  it('a global mystery cannot be finished alone', () => {
    for (const m of MYSTERIES) {
      if (!m.global) continue
      expect(m.global.fragmentsRequired, m.id).toBeGreaterThan(1)
    }
  })
})

describe('unlocking', () => {
  const deadCity = mysteryById('dead-city')!

  it('stays shut until the player has been where it lives', () => {
    expect(isUnlocked(deadCity, ctx(fresh()))).toBe(false)
    expect(unmetConditions(deadCity, ctx(fresh())).length).toBeGreaterThan(0)
  })

  it('opens on state the player produced, never on a script', () => {
    // Visiting the page is necessary but not sufficient: they also have to have seen the eye
    // somewhere it had no business being, or come back after the timeline started moving.
    const visited = dispatch(fresh(), {
      type: 'BROWSER_NAVIGATED',
      url: 'geohost.com/Terminal/4417',
    })
    expect(isUnlocked(deadCity, ctx(visited))).toBe(false)

    const withWhois = dispatch(visited, {
      type: 'EVIDENCE_PINNED',
      evidenceId: 'e10',
      via: 'browser',
    })
    expect(isUnlocked(deadCity, ctx(withWhois))).toBe(true)

    const shifted = run(visited, [
      { type: 'RECALL_USED', query: 'bitcoin' },
      { type: 'RECALL_USED', query: 'amazon' },
    ])
    expect(isUnlocked(deadCity, ctx(shifted))).toBe(true)
  })

  it('a visit still counts once the player has browsed on', () => {
    const later = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'geohost.com/Terminal/4417' },
      { type: 'BROWSER_NAVIGATED', url: 'geohost.com/ring' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e10', via: 'browser' },
    ])
    expect(isUnlocked(deadCity, ctx(later))).toBe(true)
  })

  it('an unknown condition fails closed', () => {
    const rogue = {
      ...deadCity,
      unlock: { all: [{ kind: 'wishful' } as never], any: [] },
    }
    expect(isUnlocked(rogue, ctx(fresh()))).toBe(false)
  })

  it('a community unlock is honoured, and absent when playing offline', () => {
    const gated = {
      ...deadCity,
      unlock: { all: [{ kind: 'globalUnlock' as const, mysteryId: 'null-broadcast' }], any: [] },
    }
    expect(isUnlocked(gated, ctx(fresh()))).toBe(false)
    expect(isUnlocked(gated, ctx(fresh(), ['null-broadcast']))).toBe(true)
  })

  it('lists what has opened', () => {
    const open = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'geohost.com/Terminal/4417' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e10', via: 'browser' },
    ])
    expect(unlockedMysteries(MYSTERIES, ctx(open)).map((m) => m.id)).toEqual(['dead-city'])
  })

  it('every unlock condition points at something that exists', () => {
    const evidenceIds = new Set(content.evidence.map((e) => e.id))
    const urls = new Set(content.browser.pages.map((p) => p.url))
    const mysteryIds = new Set(MYSTERIES.map((m) => m.id))
    for (const m of MYSTERIES) {
      for (const c of [...m.unlock.all, ...m.unlock.any]) {
        if (c.kind === 'evidence')
          expect(evidenceIds.has(c.evidenceId), `${m.id} → ${c.evidenceId}`).toBe(true)
        if (c.kind === 'visitedUrl') expect(urls.has(c.url), `${m.id} → ${c.url}`).toBe(true)
        if (c.kind === 'globalUnlock')
          expect(mysteryIds.has(c.mysteryId), `${m.id} → ${c.mysteryId}`).toBe(true)
      }
    }
  })
})

describe('signal', () => {
  it('a page already read costs nothing to read again', () => {
    let state = dispatch(fresh(), { type: 'WAYUP_UNLOCKED', via: 'terminal' })
    const before = signalRemaining(state)

    state = dispatch(state, { type: 'WAYUP_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 6 })
    expect(signalRemaining(state)).toBe(before - 6)

    state = dispatch(state, { type: 'WAYUP_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 6 })
    expect(signalRemaining(state)).toBe(before - 6)
    expect(state.wayup.observed).toEqual(['wu_a'])
  })

  it('nothing is observed before the relay has been found', () => {
    const state = dispatch(fresh(), {
      type: 'WAYUP_SNAPSHOT_OBSERVED',
      snapshotId: 'wu_a',
      signalCost: 6,
    })
    expect(state.wayup.observed).toEqual([])
  })

  it('refills overnight, and what was read stays read', () => {
    let state = run(fresh(), [
      { type: 'WAYUP_UNLOCKED', via: 'terminal' },
      { type: 'WAYUP_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 9 },
    ])
    expect(signalRemaining(state)).toBeLessThan(24)

    state = dispatch(state, {
      type: 'DAY_ADVANCED',
      day: 2,
      dateISO: '2009-01-16',
      wakeMinute: 400,
      threadIds: ['unknown', 'marc', 'lea'],
      firstMailId: 'm1',
      firstFileId: 'readme',
      browserHome: 'corvid.com',
      terminalBanner: content.terminal.banner,
    })
    expect(signalRemaining(state)).toBe(24)
    expect(state.wayup.observed).toEqual(['wu_a'])
    expect(state.wayup.unlocked).toBe(true)
  })

  it('an excerpt can only be pinned from a page actually seen', () => {
    const unseen = dispatch(fresh(), {
      type: 'WAYUP_EVIDENCE_PINNED',
      id: 'f1',
      snapshotId: 'wu_never',
      excerpt: 'x',
      excerptHash: 'a'.repeat(64),
    })
    expect(unseen.wayup.futureEvidence).toEqual([])

    const seen = run(fresh(), [
      { type: 'WAYUP_UNLOCKED', via: 'terminal' },
      { type: 'WAYUP_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 2 },
      {
        type: 'WAYUP_EVIDENCE_PINNED',
        id: 'f1',
        snapshotId: 'wu_a',
        excerpt: 'Its incorporation date has changed.',
        excerptHash: 'b'.repeat(64),
      },
    ])
    expect(seen.wayup.futureEvidence).toHaveLength(1)
    expect(seen.wayup.futureEvidence[0]?.capturedDay).toBe(1)
  })
})

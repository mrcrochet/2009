import { describe, expect, it } from 'vitest'
import { MysterySchema } from '@/engine/mystery-schema'
import { MYSTERIES, mysteryById } from '@/content/mysteries'
import { isUnlocked, signalRemaining, unlockedMysteries, unmetConditions } from '@/engine/mysteries'
import { selectReportSummary } from '@/engine/selectors'
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
  const mirror = mysteryById('session-mirror')!

  it('stays shut until the player has been where it lives', () => {
    expect(isUnlocked(mirror, ctx(fresh()))).toBe(false)
    expect(unmetConditions(mirror, ctx(fresh())).length).toBeGreaterThan(0)
  })

  it('opens on state the player produced, never on a script', () => {
    // Reading the statement is necessary but not sufficient: they also have to have opened a
    // device, or have been loud enough that somebody would have had a reason to look.
    const read = dispatch(fresh(), { type: 'FILE_OPENED', fileId: 'f2' })
    expect(isUnlocked(mirror, ctx(read))).toBe(false)

    const opened = dispatch(read, {
      type: 'DEVICE_UNLOCK_ATTEMPTED',
      deviceId: 'dev-phone',
      key: '190455',
    })
    expect(isUnlocked(mirror, ctx(opened))).toBe(true)

    const loud = { ...read, exposure: 24 }
    expect(isUnlocked(mirror, ctx(loud))).toBe(true)
  })

  it('a wrong passcode does not open the device, and so does not open this', () => {
    const refused = run(fresh(), [
      { type: 'FILE_OPENED', fileId: 'f2' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '000000' },
    ])
    expect(refused.devices['dev-phone']?.unlocked).toBe(false)
    expect(isUnlocked(mirror, ctx(refused))).toBe(false)
  })

  it('an unknown condition fails closed', () => {
    const rogue = {
      ...mirror,
      unlock: { all: [{ kind: 'wishful' } as never], any: [] },
    }
    expect(isUnlocked(rogue, ctx(fresh()))).toBe(false)
  })

  it('a community unlock is honoured, and absent when playing offline', () => {
    const gated = {
      ...mirror,
      unlock: { all: [{ kind: 'globalUnlock' as const, mysteryId: 'session-mirror' }], any: [] },
    }
    expect(isUnlocked(gated, ctx(fresh()))).toBe(false)
    expect(isUnlocked(gated, ctx(fresh(), ['session-mirror']))).toBe(true)
  })

  it('lists what has opened', () => {
    const open = run(fresh(), [
      { type: 'FILE_OPENED', fileId: 'f2' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
    ])
    expect(unlockedMysteries(MYSTERIES, ctx(open)).map((m) => m.id)).toEqual(['session-mirror'])
  })

  it('every unlock condition points at something that exists', () => {
    const evidenceIds = new Set(content.evidence.map((e) => e.id))
    const urls = new Set(content.browser.pages.map((p) => p.url))
    const mysteryIds = new Set(MYSTERIES.map((m) => m.id))
    const deviceIds = new Set(content.devices.map((d) => d.id))
    const serviceIds = new Set(content.services.map((s) => s.id))
    const beats = new Set([
      ...content.files.flatMap((f) => (f.beat ? [f.beat] : [])),
      ...content.threads.flatMap((t) => (t.beat ? [t.beat] : [])),
      ...content.devices.flatMap((d) => (d.beat ? [d.beat] : [])),
      'claim',
    ])
    for (const m of MYSTERIES) {
      for (const c of [...m.unlock.all, ...m.unlock.any]) {
        if (c.kind === 'evidence')
          expect(evidenceIds.has(c.evidenceId), `${m.id} → ${c.evidenceId}`).toBe(true)
        if (c.kind === 'visitedUrl') expect(urls.has(c.url), `${m.id} → ${c.url}`).toBe(true)
        if (c.kind === 'globalUnlock')
          expect(mysteryIds.has(c.mysteryId), `${m.id} → ${c.mysteryId}`).toBe(true)
        if (c.kind === 'deviceUnlocked')
          expect(deviceIds.has(c.deviceId), `${m.id} → ${c.deviceId}`).toBe(true)
        if (c.kind === 'serviceGranted')
          expect(serviceIds.has(c.serviceId), `${m.id} → ${c.serviceId}`).toBe(true)
        if (c.kind === 'beat') expect(beats.has(c.beat), `${m.id} → ${c.beat}`).toBe(true)
      }
    }
  })
})

describe('signal', () => {
  it('a page already read costs nothing to read again', () => {
    let state = dispatch(fresh(), { type: 'RELAY_UNLOCKED', via: 'terminal' })
    const before = signalRemaining(state, content)

    state = dispatch(state, { type: 'RELAY_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 6 })
    expect(signalRemaining(state, content)).toBe(before - 6)

    state = dispatch(state, { type: 'RELAY_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 6 })
    expect(signalRemaining(state, content)).toBe(before - 6)
    expect(state.relay.observed).toEqual(['wu_a'])
  })

  it('nothing is observed before the relay has been found', () => {
    const state = dispatch(fresh(), {
      type: 'RELAY_SNAPSHOT_OBSERVED',
      snapshotId: 'wu_a',
      signalCost: 6,
    })
    expect(state.relay.observed).toEqual([])
  })

  /**
   * There is no night any more, and so no refill.
   *
   * A case is worked in one sitting, and the budget is the case's whole allowance. What a
   * thirty-day season spent per day, an investigation spends once — which is what makes an
   * investigator choose what they most need to know instead of looking up everything.
   */
  it('does not refill, because a case is one sitting', () => {
    const state = run(fresh(), [
      { type: 'RELAY_UNLOCKED', via: 'terminal' },
      { type: 'RELAY_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 9 },
    ])
    expect(signalRemaining(state, content)).toBe(content.relay!.signalBudget - 9)
    expect(state.relay.observed).toEqual(['wu_a'])
    expect(state.relay.unlocked).toBe(true)
  })

  it('an excerpt can only be pinned from a page actually seen', () => {
    const unseen = dispatch(fresh(), {
      type: 'RELAY_EXCERPT_KEPT',
      id: 'f1',
      snapshotId: 'wu_never',
      excerpt: 'x',
      sourceUrl: 'example.test/a',
      sourceTitle: 'A page',
      excerptHash: 'a'.repeat(64),
    })
    expect(unseen.relay.kept).toEqual([])

    const seen = run(fresh(), [
      { type: 'RELAY_UNLOCKED', via: 'terminal' },
      { type: 'RELAY_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 2 },
      {
        type: 'RELAY_EXCERPT_KEPT',
        id: 'f1',
        snapshotId: 'wu_a',
        excerpt: 'Its incorporation date has changed.',
        sourceUrl: 'example.test/a',
        sourceTitle: 'A page',
        excerptHash: 'b'.repeat(64),
      },
    ])
    expect(seen.relay.kept).toHaveLength(1)
    expect(seen.relay.kept[0]?.capturedAt).toBe(seen.minute)
  })
})

/**
 * The rule in CLAUDE.md §7: anything the game accumulates and never spends is a hole a player
 * will feel. A line carried back from 2026 used to land in an array nothing read.
 */
describe('what a kept line costs, and where it goes', () => {
  const keep = (id: string, hash: string) => ({
    type: 'RELAY_EXCERPT_KEPT' as const,
    id,
    snapshotId: 'wu_a',
    excerpt: 'a sentence that has not happened',
    excerptHash: hash,
    sourceUrl: 'example.test/a',
    sourceTitle: 'A page',
  })

  const seen = () =>
    run(fresh(), [
      { type: 'RELAY_UNLOCKED', via: 'terminal' },
      { type: 'RELAY_SNAPSHOT_OBSERVED', snapshotId: 'wu_a', signalCost: 2 },
    ])

  it('moves the world, because the sentence is now somewhere it was not', () => {
    const before = seen()
    const after = dispatch(before, keep('f1', 'a'.repeat(64)))
    expect(after.exposure).toBe(before.exposure + content.relay!.keepExposure)
    expect(after.relay.kept).toHaveLength(1)
  })

  it('remembers where it came from, so an offline replay can still say', () => {
    const after = dispatch(seen(), keep('f1', 'a'.repeat(64)))
    expect(after.relay.kept[0]?.sourceUrl).toBe('example.test/a')
    expect(after.relay.kept[0]?.sourceTitle).toBe('A page')
  })

  it('is read back on the report', () => {
    const after = dispatch(seen(), keep('f1', 'a'.repeat(64)))
    const summary = selectReportSummary(after, content)
    expect(summary.deeds.join('\n')).toContain('carried 1 lines in from outside the case')
  })

  it('the same line kept twice is one line and costs once', () => {
    let state = dispatch(seen(), keep('f1', 'a'.repeat(64)))
    const once = state.exposure
    state = dispatch(state, keep('f2', 'a'.repeat(64)))
    expect(state.relay.kept).toHaveLength(1)
    expect(state.exposure).toBe(once)
  })
})

describe('asking costs, even when nothing comes back', () => {
  it('spends signal on the question, not only on the answer', () => {
    const state = run(fresh(), [
      { type: 'RELAY_UNLOCKED', via: 'terminal' },
      { type: 'RELAY_SEARCHED', signalCost: content.relay!.searchCost },
    ])
    expect(signalRemaining(state, content)).toBe(
      content.relay!.signalBudget - content.relay!.searchCost,
    )
  })

  it('cannot be asked past the case’s budget', () => {
    const unlocked = dispatch(fresh(), { type: 'RELAY_UNLOCKED', via: 'terminal' })
    const over = dispatch(unlocked, {
      type: 'RELAY_SEARCHED',
      signalCost: content.relay!.signalBudget + 1,
    })
    expect(over).toBe(unlocked)
  })

  it('is not a thing an unattached machine can do', () => {
    const state = dispatch(fresh(), { type: 'RELAY_SEARCHED', signalCost: 1 })
    expect(state.relay.signalSpent).toBe(0)
  })
})

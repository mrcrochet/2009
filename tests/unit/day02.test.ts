import { describe, expect, it } from 'vitest'
import { advanceEventFor, contentForDay, DAY_01, DAY_02 } from '@/content'
import { applyEvents } from '@/engine/reducer'
import { stamp } from '@/engine/events'
import { createTimeline } from '@/engine/initial-state'
import { selectCanEndDay } from '@/engine/selectors'
import type { EventInput } from '@/engine/events'
import type { TimelineState } from '@/engine/types'

/**
 * Day 02, played through the real content.
 *
 * The architectural claim in `CLAUDE.md` is that days 02–30 are content rather than rewrites.
 * This is where that is cashed: a second authored day, reached across a real night, walked to
 * its own gate, with a claim that cannot be made without something the player found yesterday.
 */

/** Dispatch the way the store does, against whichever day the timeline is on. */
function play(state: TimelineState, inputs: readonly EventInput[]): TimelineState {
  return applyEvents(
    state,
    inputs.map((input) => stamp(state, input)),
    contentForDay,
  )
}

/** A Thursday played far enough to have found the things Friday asks about. */
function thursday(): TimelineState {
  const start = createTimeline(DAY_01, { id: 'day02-test', now: '2026-01-01T00:00:00.000Z' })
  return play(start, [
    { type: 'BOOT_COMPLETED' },
    { type: 'FILE_OPENED', fileId: 'readme' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e7', via: 'terminal' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e9', via: 'browser' },
    { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'Nokora N90' },
    { type: 'ITEM_LISTED', itemId: 'tradepost-n90' },
    { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 },
    { type: 'DAY_ENDED' },
  ])
}

const friday = () => play(thursday(), [advanceEventFor(2)])

describe('the second day', () => {
  it('is content: the engine reaches it with the event the shell already sends', () => {
    const state = friday()
    expect(state.day).toBe(2)
    expect(state.dateISO).toBe('2009-01-16')
    expect(state.minuteOfDay).toBe(DAY_02.wakeMinute)
    // Cash crossed the night; the day's own opening balance is not consulted again.
    expect(state.cashCents).toBe(thursday().cashCents)
  })

  it('starts the machine, so the day gets its opening', () => {
    const state = friday()
    expect(state.stage).toBe('boot')
    // The banner is the first beat: somebody used this at 04:03 from another address.
    expect(DAY_02.boot.join('\n')).toContain('04:03')
  })

  it('is shorter than Thursday, and asking costs more', () => {
    const hours = (d: typeof DAY_01) => d.endMinute - d.wakeMinute
    expect(hours(DAY_02)).toBeLessThan(hours(DAY_01))
    expect(DAY_02.recall.costPerUse).toBeGreaterThan(DAY_01.recall.costPerUse)
    // Coherence does not refill overnight, so a harder floor bites a player who spent yesterday.
    expect(DAY_02.recall.degradeBelow).toBeGreaterThan(DAY_01.recall.degradeBelow)
  })

  /**
   * The whole point of a continuous timeline. `c7` cannot be asserted by anybody who did not
   * open the bank on Thursday — not because the day hides it, but because they do not have it.
   */
  it('accepts a claim that needs both days, and only from a player who has both', () => {
    const held = play(friday(), [
      { type: 'BOOT_COMPLETED' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
      { type: 'CLAIM_SELECTED', claimId: 'c7' },
      { type: 'CLAIM_ASSERTED', claimId: 'c7', evidenceIds: ['1:e4', 'e1'] },
    ])
    expect(held.lastVerdict?.verdict).toBe('accepted')

    // The same Friday, played by somebody who never opened the bank on Thursday.
    const thin = play(
      play(createTimeline(DAY_01, { id: 'thin', now: '2026-01-01T00:00:00.000Z' }), [
        { type: 'BOOT_COMPLETED' },
        { type: 'DAY_ENDED' },
        advanceEventFor(2),
      ]),
      [
        { type: 'BOOT_COMPLETED' },
        { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
        { type: 'CLAIM_SELECTED', claimId: 'c7' },
        { type: 'CLAIM_ASSERTED', claimId: 'c7', evidenceIds: ['1:e4', 'e1'] },
      ],
    )
    expect(thin.lastVerdict?.verdict).toBe('insufficient')
  })

  it('carries the evidence it says it carries, and no more', () => {
    const carried = DAY_02.carriedEvidence.map((e) => e.id)
    const thursdayIds = new Set(DAY_01.evidence.map((e) => `1:${e.id}`))
    for (const id of carried) expect(thursdayIds.has(id), id).toBe(true)
    // Every carried id is named by a claim, or it is scenery in the tray.
    const needed = new Set(DAY_02.claims.flatMap((c) => c.need))
    const orphans = carried.filter((id) => !needed.has(id))
    expect(orphans.length, `carried but unused: ${orphans.join(', ')}`).toBeLessThanOrEqual(1)
  })

  it('can be finished', () => {
    let state = play(friday(), [{ type: 'BOOT_COMPLETED' }])
    expect(selectCanEndDay(state, DAY_02)).toBe(false)

    state = play(state, [
      // brief
      { type: 'FILE_OPENED', fileId: 'brief' },
      // voss — a thread's beat fires when the player answers, not when they open it
      { type: 'THREAD_SELECTED', thread: 'lea' },
      { type: 'CHAT_STARTED', thread: 'lea' },
      {
        type: 'CHAT_REPLY_SENT',
        thread: 'lea',
        text: DAY_02.threads[0]!.script[0]!.choices[0]!.text,
        reply: '',
        advances: true,
      },
      // recall
      { type: 'RECALL_USED', query: DAY_02.memories[0]!.keys[0]! },
      // trade — a trade is a beat when it settles, not when it is bought
      { type: 'ITEM_PURCHASED', itemId: 'service-manuals', amountCents: 2200, label: 'manuals' },
      { type: 'ITEM_LISTED', itemId: 'service-manuals' },
      { type: 'ITEM_SOLD', itemId: 'service-manuals', amountCents: 6400 },
      // claim
      { type: 'CLAIM_SELECTED', claimId: 'c11' },
      { type: 'CLAIM_ASSERTED', claimId: 'c11', evidenceIds: [] },
    ])

    for (const beat of DAY_02.requiredBeats) {
      expect(state.beats[beat], `beat "${beat}" never fired`).toBe(true)
    }
    expect(selectCanEndDay(state, DAY_02)).toBe(true)
  })

  it('does not hand Friday the key to Thursday’s file', () => {
    // Both days encrypt something; opening one is not opening the other.
    const opened = play(thursday(), [
      {
        type: 'TERMINAL_COMMAND_RUN',
        command: `decrypt cibles.enc --key ${DAY_01.terminal.decrypt.key}`,
      },
    ])
    const next = play(opened, [advanceEventFor(2)])
    expect(next.files.decrypted[DAY_01.terminal.decrypt.fileId]).toBe(true)
    expect(next.files.decrypted[DAY_02.terminal.decrypt.fileId]).toBeUndefined()
  })

  it('cannot reach the quota, on the best day anybody could have', () => {
    const best = DAY_02.economy.opportunities
      .filter((o) => o.sellCents > o.buyCents)
      .reduce((sum, o) => sum + (o.sellCents - o.buyCents), 0)
    expect(DAY_01.economy.openingCashCents + best).toBeLessThan(DAY_02.economy.quotaCents)
  })
})

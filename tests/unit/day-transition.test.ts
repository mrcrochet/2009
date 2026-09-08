import { describe, expect, it } from 'vitest'
import { applyEvents } from '@/engine/reducer'
import { createTimeline } from '@/engine/initial-state'
import { selectCanEndDay, selectEvidenceCards } from '@/engine/selectors'
import { StoredTimelineSchema } from '@/engine/timeline-schema'
import { qualifyEvidenceId, unqualifyEvidenceId } from '@/engine/types'
import { toStored } from '@/lib/persistence/types'
import type { EventInput } from '@/engine/events'
import { content, dispatch, fresh, run } from './helpers'

/** A second day, expressed as the event the shell dispatches when the player continues. */
const ADVANCE: EventInput = {
  type: 'DAY_ADVANCED',
  day: 2,
  dateISO: '2009-01-16',
  wakeMinute: 6 * 60 + 40,
  threadIds: ['unknown', 'marc', 'lea'],
  firstMailId: 'm1',
  firstFileId: 'readme',
  browserHome: 'corvid.com',
  terminalBanner: content.terminal.banner,
}

/** A Day 01 played thoroughly enough that every kind of state has something in it. */
function livedDayOne() {
  return run(fresh(), [
    { type: 'FILE_OPENED', fileId: 'readme' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
    { type: 'CLAIM_SELECTED', claimId: 'c4' },
    { type: 'CLAIM_ASSERTED', claimId: 'c4', evidenceIds: ['e3'] },
    { type: 'RECALL_USED', query: 'bitcoin' },
    { type: 'RECALL_USED', query: 'amazon' },
    { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'n90' },
    { type: 'ITEM_LISTED', itemId: 'tradepost-n90' },
    { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 },
    { type: 'DOMAIN_REGISTERED', domain: 'shortclip.com', amountCents: 995 },
    { type: 'WATCHLIST_TOGGLED', symbol: 'AAPL' },
    { type: 'NOTES_CHANGED', value: 'he died on the 19th' },
    { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt cibles.enc --key 0412' },
    { type: 'CHAT_STARTED', thread: 'lea' },
    {
      type: 'CHAT_REPLY_SENT',
      thread: 'lea',
      text: 'Take the post down.',
      reply: 'ok',
      setsFlag: 'leaPostRemoved',
    },
    { type: 'CHAT_ADVANCED', thread: 'lea' },
    { type: 'APP_OPENED', app: 'web' },
    { type: 'BROWSER_SEARCHED', query: 'rask' },
    { type: 'DAY_ENDED' },
    { type: 'DAY_CARD_SHOWN' },
  ])
}

describe('the night', () => {
  it('carries who the player has become', () => {
    const before = livedDayOne()
    const after = dispatch(before, ADVANCE)

    // Money, and everything it passed through.
    expect(after.cashCents).toBe(before.cashCents)
    expect(after.ledger).toEqual(before.ledger)
    expect(after.inventory).toEqual(before.inventory)
    expect(after.domains).toEqual(['shortclip.com'])
    expect(after.watchlist).toEqual(['AAPL'])

    // Coherence does not come back overnight. That is the premise of the whole mechanic.
    expect(after.memoryIntegrity).toBe(before.memoryIntegrity)
    expect(after.memoryIntegrity).toBeLessThan(100)
    expect(after.recalls).toEqual(before.recalls)

    // What they were seen doing, and what they put their name to.
    expect(after.heat).toBe(before.heat)
    expect(after.heat).toBeGreaterThan(0)
    expect(after.divergence).toBe(before.divergence)
    expect(after.temporalShift).toBe(before.temporalShift)
    expect(after.claimLog).toEqual(before.claimLog)
    expect(after.claimLog).toHaveLength(1)

    // Evidence, decisions, and the notebook.
    expect(after.evidence).toEqual(before.evidence)
    expect(after.flags.leaPostRemoved).toBe(true)
    expect(after.files.decrypted.enc).toBe(true)
    expect(after.notes).toBe('he died on the 19th')
  })

  it('clears the surface of the day that ended', () => {
    const after = dispatch(livedDayOne(), ADVANCE)

    expect(after.day).toBe(2)
    expect(after.dateISO).toBe('2009-01-16')
    // The second morning starts the machine, so every scripted opening the shell hangs off
    // boot → playing happens again — including the login banner, which is the day's first beat.
    expect(after.stage).toBe('boot')
    expect(after.bootLine).toBe(0)
    expect(after.minuteOfDay).toBe(6 * 60 + 40)

    expect(after.windows).toEqual([])
    expect(after.desktopIcons).toEqual([])
    expect(after.ui).toEqual({
      trayOpen: false,
      boardOpen: false,
      watched: false,
      dayCard: false,
      wayupOpen: false,
    })
    expect(after.mail.unknownArrived).toBe(false)
    expect(after.chat.log.lea).toEqual([])
    expect(after.chat.step.lea).toBe(0)
    expect(after.browser.history).toEqual([])
    expect(after.browser.view).toBe('home')
    expect(after.terminal.lines).toHaveLength(1)
    expect(after.selectedEvidenceIds).toEqual([])
    expect(after.lastVerdict).toBeNull()
  })

  it('closes the gate the previous day opened', () => {
    // The bug this exists to prevent: beats were one shared namespace, so a finished Day 01
    // opened Day 02's gate before it had started.
    const finished = run(fresh(), [
      { type: 'FILE_OPENED', fileId: 'readme' },
      { type: 'CHAT_STARTED', thread: 'marc' },
      { type: 'CHAT_REPLY_SENT', thread: 'marc', text: 'What kind of thing?' },
      { type: 'RECALL_USED', query: 'bitcoin' },
      { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'n90' },
      { type: 'ITEM_LISTED', itemId: 'tradepost-n90' },
      { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 },
      { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: [] },
    ])
    expect(selectCanEndDay(finished, content)).toBe(true)

    const tomorrow = dispatch(finished, ADVANCE)
    expect(tomorrow.beats).toEqual({})
    expect(selectCanEndDay(tomorrow, content)).toBe(false)
  })

  it('refuses to go backwards or sideways', () => {
    const state = dispatch(livedDayOne(), ADVANCE)
    expect(dispatch(state, ADVANCE)).toBe(state)
    expect(dispatch(state, { ...ADVANCE, day: 1 })).toBe(state)
  })

  it('a second day can wake at a different hour', () => {
    const early = dispatch(livedDayOne(), { ...ADVANCE, wakeMinute: 4 * 60 })
    expect(early.minuteOfDay).toBe(240)
  })
})

describe('evidence belongs to the day it was found on', () => {
  it('qualifies what is pinned, and still shows it tomorrow', () => {
    const before = livedDayOne()
    // e7 comes from the terminal decrypt, which pins as a side effect.
    expect(before.evidence.map((e) => e.id)).toEqual(['1:e1', '1:e3', '1:e4', '1:e7'])
    expect(before.evidence.every((e) => e.day === 1)).toBe(true)

    // A caseboard on the 16th still shows the 15th's evidence — the day declares what it carries.
    const day2 = {
      ...content,
      day: 2,
      carriedEvidence: content.evidence.map((e) => ({ ...e, id: qualifyEvidenceId(1, e.id) })),
    }
    const tomorrow = dispatch(before, ADVANCE)
    const cards = selectEvidenceCards(tomorrow, day2)
    expect(cards.map((c) => c.id)).toEqual(['1:e1', '1:e3', '1:e4', '1:e7'])
    expect(cards.every((c) => c.day === 1)).toBe(true)
    expect(cards[0]?.text).toContain('Quota 01')
  })

  it('two days cannot collide on the same short id', () => {
    const before = livedDayOne()
    const tomorrow = dispatch(before, ADVANCE)
    // Day 02 authoring its own `e1` must not be the same object as Day 01's.
    const after = dispatch(tomorrow, { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' })
    expect(after.evidence.map((e) => e.id)).toContain('1:e1')
    expect(after.evidence.map((e) => e.id)).toContain('2:e1')
    expect(after.evidence.filter((e) => unqualifyEvidenceId(e.id) === 'e1')).toHaveLength(2)
  })
})

describe('a two-day timeline still replays', () => {
  it('reproduces itself from the log', () => {
    const played = dispatch(livedDayOne(), ADVANCE)
    const withDayTwo = run(played, [
      { type: 'APP_OPENED', app: 'files' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'mail' },
      { type: 'RECALL_USED', query: 'obama' },
      { type: 'NOTES_CHANGED', value: 'day two' },
    ])

    const base = createTimeline(content, {
      id: withDayTwo.id,
      stage: 'playing',
      now: withDayTwo.createdAt,
    })
    const replayed = applyEvents(base, withDayTwo.eventLog, content)

    const { eventLog: _a, updatedAt: _b, ...playedRest } = withDayTwo
    const { eventLog: _c, updatedAt: _d, ...replayedRest } = replayed
    expect(replayedRest).toEqual(playedRest)
    expect(replayed.day).toBe(2)
    expect(replayed.evidence.map((e) => e.id)).toContain('2:e2')
  })

  it('and still fits in a save', () => {
    const played = dispatch(livedDayOne(), ADVANCE)
    expect(StoredTimelineSchema.safeParse(toStored(played)).success).toBe(true)
  })
})

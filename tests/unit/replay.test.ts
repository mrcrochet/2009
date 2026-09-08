import { describe, expect, it } from 'vitest'
import { applyEvents } from '@/engine/reducer'
import { withoutDraftInput } from '@/engine/events'
import { createTimeline } from '@/engine/initial-state'
import { createGameStore } from '@/state/store'
import { toStored } from '@/lib/persistence/types'
import { content, fresh, run } from './helpers'

/**
 * The whole point of event sourcing here: a save can be replayed. If this ever fails, some
 * transition has become impure or time-dependent.
 */
describe('replay', () => {
  it('reproduces a full Day 01 snapshot from its event log', () => {
    const played = run(fresh('landing'), [
      { type: 'WOKE_UP' },
      ...Array.from({ length: content.boot.length }, () => ({ type: 'BOOT_ADVANCED' as const })),
      { type: 'BOOT_COMPLETED' },
      { type: 'APP_OPENED', app: 'msg' },
      { type: 'CHAT_STARTED', thread: 'unknown' },
      { type: 'CHAT_REPLY_SENT', thread: 'unknown', text: 'Who is this?' },
      { type: 'CHAT_ADVANCED', thread: 'unknown' },
      { type: 'DESKTOP_ICON_APPEARED', iconId: 'readme' },
      { type: 'APP_OPENED', app: 'files' },
      { type: 'FILE_OPENED', fileId: 'readme' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_SEARCHED', query: 'tradepost' },
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com/pdx/electronics' },
      { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'n90' },
      { type: 'ITEM_LISTED', itemId: 'tradepost-n90' },
      { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 },
      { type: 'APP_OPENED', app: 'term' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt cibles.enc --key 0412' },
      { type: 'APP_OPENED', app: 'recall' },
      { type: 'RECALL_USED', query: 'bitcoin' },
      { type: 'THREAD_SELECTED', thread: 'marc' },
      { type: 'CHAT_STARTED', thread: 'marc' },
      { type: 'CHAT_REPLY_SENT', thread: 'marc', text: 'What kind of thing?' },
      { type: 'CHAT_ADVANCED', thread: 'marc' },
      { type: 'BOARD_TOGGLED', open: true },
      { type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: 'e1' },
      { type: 'CLAIM_SELECTED', claimId: 'c1' },
      { type: 'CLAIM_ASSERTED', claimId: 'c1', evidenceIds: ['e1'] },
      { type: 'DAY_ENDED' },
      { type: 'DAY_CARD_SHOWN' },
    ])

    const base = createTimeline(content, {
      id: played.id,
      stage: 'landing',
      now: '2026-01-01T00:00:00.000Z',
    })
    const replayed = applyEvents(base, played.eventLog, content)

    const { eventLog: _a, updatedAt: _b, ...playedRest } = withoutDraftInput(played)
    const { eventLog: _c, updatedAt: _d, ...replayedRest } = withoutDraftInput(replayed)
    expect(replayedRest).toEqual(playedRest)
    expect(replayed.cashCents).toBe(71782)
    expect(replayed.minuteOfDay).toBe(played.minuteOfDay)
  })

  it('drops keystroke-level events from the log but keeps their effect', () => {
    const state = run(fresh(), [
      { type: 'NOTES_CHANGED', value: 'the account was opened on the 6th' },
      { type: 'RECALL_QUERY_CHANGED', value: 'bitcoin' },
      { type: 'BROWSER_QUERY_CHANGED', query: 'tradepost' },
    ])
    expect(state.notes).toBe('the account was opened on the 6th')
    expect(state.recallQuery).toBe('bitcoin')
    expect(state.eventLog.filter((e) => e.type === 'RECALL_QUERY_CHANGED')).toHaveLength(0)
    expect(state.eventLog.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(1)
  })
})

describe('save size', () => {
  it('typing a long note does not make the log grow with the square of it', () => {
    const api = createGameStore({ content, timeline: fresh() })
    const note = 'the account was opened on the 6th, eighteen days after he died. '
    for (let i = 1; i <= 200; i += 1) {
      api.getState().dispatch({ type: 'NOTES_CHANGED', value: note.repeat(i) })
    }
    const state = api.getState().timeline

    // One entry for the whole run, carrying the final text.
    expect(state.eventLog.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(1)
    expect(state.notes).toBe(note.repeat(200))

    const bytes = JSON.stringify(toStored(state)).length
    expect(bytes).toBeLessThan(60_000)

    // And the coalesced log still replays to the same state.
    const base = createTimeline(content, { id: state.id, now: state.createdAt })
    expect(applyEvents(base, state.eventLog, content).notes).toBe(state.notes)
  })

  it('an interleaved event breaks the run, so history is not lost', () => {
    const api = createGameStore({ content, timeline: fresh() })
    api.getState().dispatch({ type: 'NOTES_CHANGED', value: 'first' })
    api.getState().dispatch({ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' })
    api.getState().dispatch({ type: 'NOTES_CHANGED', value: 'second' })

    const log = api.getState().timeline.eventLog
    expect(log.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(2)
    expect(log.map((e) => e.type)).toEqual(['NOTES_CHANGED', 'EVIDENCE_PINNED', 'NOTES_CHANGED'])
  })
})

describe('replay under a hostile log', () => {
  it('reproduces a session of interleaving, switching and backtracking', () => {
    const played = run(fresh(), [
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_SEARCHED', query: 'rask' },
      { type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/obits/rask' },
      { type: 'BROWSER_WENT_BACK' },
      { type: 'BROWSER_WENT_FORWARD' },
      { type: 'NOTES_CHANGED', value: 'he died' },
      { type: 'CHAT_STARTED', thread: 'marc' },
      { type: 'CHAT_STARTED', thread: 'lea' },
      { type: 'CHAT_REPLY_SENT', thread: 'marc', text: 'q', reply: 'MARC' },
      { type: 'NOTES_CHANGED', value: 'he died on the 19th' },
      {
        type: 'CHAT_REPLY_SENT',
        thread: 'lea',
        text: 'q',
        reply: 'LEA',
        setsFlag: 'leaPostRemoved',
      },
      { type: 'CHAT_ADVANCED', thread: 'lea' },
      { type: 'CHAT_ADVANCED', thread: 'marc' },
      { type: 'ITEM_PURCHASED', itemId: 'tradepost-parts', amountCents: 4000, label: 'parts' },
      { type: 'ITEM_LISTED', itemId: 'tradepost-parts' },
      { type: 'ITEM_SOLD', itemId: 'tradepost-parts', amountCents: 1500 },
      { type: 'TERMINAL_COMMAND_RUN', command: 'ps' },
      { type: 'RECALL_USED', query: 'what happens to apple' },
      { type: 'BROWSER_URL_CHANGED', url: 'half-typed.com' },
    ])

    // The base has to start where the played timeline did, or `stage` alone diverges.
    const base = createTimeline(content, {
      id: played.id,
      stage: 'playing',
      now: played.createdAt,
    })
    const replayed = applyEvents(base, played.eventLog, content)

    const { eventLog: _a, updatedAt: _b, ...playedRest } = withoutDraftInput(played)
    const { eventLog: _c, updatedAt: _d, ...replayedRest } = withoutDraftInput(replayed)
    expect(replayedRest).toEqual(playedRest)
  })
})

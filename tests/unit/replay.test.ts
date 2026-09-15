import { describe, expect, it } from 'vitest'
import { applyEvents } from '@/engine/reducer'
import { withoutDraftInput } from '@/engine/events'
import { createInvestigation } from '@/engine/initial-state'
import { createGameStore } from '@/state/store'
import { toStored } from '@/lib/persistence/types'
import { content, fresh, run } from './helpers'

/**
 * The whole point of event sourcing here: a save can be replayed. If this ever fails, some
 * transition has become impure or time-dependent.
 */
describe('replay', () => {
  it('reproduces a full session from its event log', () => {
    const played = run(fresh('intake'), [
      { type: 'CASE_OPENED' },
      ...Array.from({ length: content.boot.length }, () => ({ type: 'BOOT_ADVANCED' as const })),
      { type: 'BOOT_COMPLETED' },
      { type: 'APP_OPENED', app: 'msg' },
      { type: 'CHAT_STARTED', thread: 'unknown' },
      { type: 'CHAT_REPLY_SENT', thread: 'unknown', text: 'Who is this?' },
      { type: 'CHAT_ADVANCED', thread: 'unknown' },
      { type: 'DESKTOP_ICON_APPEARED', iconId: 'readme' },
      { type: 'APP_OPENED', app: 'files' },
      { type: 'FILE_OPENED', fileId: 'f2' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'files' },
      { type: 'APP_OPENED', app: 'devices' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
      { type: 'PHONE_TOGGLED' },
      { type: 'SMS_ADVANCED' },
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_SEARCHED', query: 'marlow' },
      { type: 'BROWSER_NAVIGATED', url: 'marlowfoundation.org/filings' },
      { type: 'APP_OPENED', app: 'term' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt marlow-2013.enc --key reyes' },
      { type: 'APP_OPENED', app: 'notes' },
      { type: 'THREAD_SELECTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'claire' },
      { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'Tell me about Sunday.' },
      { type: 'CHAT_ADVANCED', thread: 'claire' },
      { type: 'BOARD_TOGGLED', open: true },
      { type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: 'e2' },
      { type: 'CLAIM_SELECTED', claimId: 'c2' },
      { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: ['e2', 'e7'] },
      { type: 'REPORT_FILED' },
      { type: 'REPORT_CARD_SHOWN' },
    ])

    const base = createInvestigation(content, {
      id: played.id,
      stage: 'intake',
      now: '2026-06-17T00:00:00.000Z',
    })
    const replayed = applyEvents(base, played.eventLog, content)

    const { eventLog: _a, updatedAt: _b, ...playedRest } = withoutDraftInput(played)
    const { eventLog: _c, updatedAt: _d, ...replayedRest } = withoutDraftInput(replayed)
    expect(replayedRest).toEqual(playedRest)
    expect(replayed.evidence.map((e) => e.id)).toEqual(played.evidence.map((e) => e.id))
    expect(replayed.minute).toBe(played.minute)
  })

  it('drops keystroke-level events from the log but keeps their effect', () => {
    const state = run(fresh(), [
      { type: 'NOTES_CHANGED', value: 'the receipt is timed after his statement' },
      { type: 'BROWSER_QUERY_CHANGED', query: 'marlow' },
      { type: 'TERMINAL_INPUT_CHANGED', value: 'decrypt ' },
    ])
    expect(state.notes).toBe('the receipt is timed after his statement')
    expect(state.browser.query).toBe('marlow')
    expect(state.eventLog.filter((e) => e.type === 'BROWSER_QUERY_CHANGED')).toHaveLength(0)
    expect(state.eventLog.filter((e) => e.type === 'TERMINAL_INPUT_CHANGED')).toHaveLength(0)
    expect(state.eventLog.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(1)
  })
})

describe('save size', () => {
  it('typing a long note does not make the log grow with the square of it', () => {
    const api = createGameStore({ content, investigation: fresh() })
    const note = 'the receipt is timed at 22:47, which is after he says he last saw him. '
    for (let i = 1; i <= 200; i += 1) {
      api.getState().dispatch({ type: 'NOTES_CHANGED', value: note.repeat(i) })
    }
    const state = api.getState().investigation

    // One entry for the whole run, carrying the final text.
    expect(state.eventLog.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(1)
    expect(state.notes).toBe(note.repeat(200).slice(0, state.notes.length))

    const bytes = JSON.stringify(toStored(state)).length
    expect(bytes).toBeLessThan(60_000)

    // And the coalesced log still replays to the same state.
    const base = createInvestigation(content, { id: state.id, now: state.createdAt })
    expect(applyEvents(base, state.eventLog, content).notes).toBe(state.notes)
  })

  it('an interleaved event breaks the run, so history is not lost', () => {
    const api = createGameStore({ content, investigation: fresh() })
    api.getState().dispatch({ type: 'NOTES_CHANGED', value: 'first' })
    api.getState().dispatch({ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' })
    api.getState().dispatch({ type: 'NOTES_CHANGED', value: 'second' })

    const log = api.getState().investigation.eventLog
    expect(log.filter((e) => e.type === 'NOTES_CHANGED')).toHaveLength(2)
    expect(log.map((e) => e.type)).toEqual(['NOTES_CHANGED', 'EVIDENCE_PINNED', 'NOTES_CHANGED'])
  })
})

describe('replay under a hostile log', () => {
  it('reproduces a session of interleaving, switching and backtracking', () => {
    const played = run(fresh(), [
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_SEARCHED', query: 'vale' },
      { type: 'BROWSER_NAVIGATED', url: 'ridgelinepartners.com/team' },
      { type: 'BROWSER_WENT_BACK' },
      { type: 'BROWSER_WENT_FORWARD' },
      { type: 'NOTES_CHANGED', value: 'he says the seventh' },
      { type: 'CHAT_STARTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'unknown' },
      { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'q', reply: 'CLAIRE' },
      { type: 'NOTES_CHANGED', value: 'he says the seventh, the receipt says the ninth' },
      {
        type: 'CHAT_REPLY_SENT',
        thread: 'unknown',
        text: 'q',
        reply: 'UNKNOWN',
        setsFlag: 'valeNotified',
      },
      { type: 'CHAT_ADVANCED', thread: 'unknown' },
      { type: 'CHAT_ADVANCED', thread: 'claire' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: 'wrong' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'ps' },
      { type: 'BROWSER_URL_CHANGED', url: 'half-typed.com' },
    ])

    // The base has to start where the played investigation did, or `stage` alone diverges.
    const base = createInvestigation(content, {
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

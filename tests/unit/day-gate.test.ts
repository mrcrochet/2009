import { describe, expect, it } from 'vitest'
import {
  selectCanEndDay,
  selectDaySummary,
  selectMail,
  selectOutstandingBeats,
} from '@/engine/selectors'
import { DAY_END_MINUTE } from '@/engine/clock'
import { content, dispatch, fresh, run } from './helpers'

function playThroughRequirements() {
  return run(fresh(), [
    { type: 'APP_OPENED', app: 'files' },
    { type: 'FILE_OPENED', fileId: 'readme' },
    { type: 'APP_OPENED', app: 'msg' },
    { type: 'THREAD_SELECTED', thread: 'marc' },
    { type: 'CHAT_STARTED', thread: 'marc' },
    { type: 'CHAT_REPLY_SENT', thread: 'marc', text: 'What kind of thing?' },
    { type: 'CHAT_ADVANCED', thread: 'marc' },
    { type: 'APP_OPENED', app: 'recall' },
    { type: 'RECALL_USED', query: 'bitcoin' },
    { type: 'ITEM_PURCHASED', itemId: 'tradepost-n90', amountCents: 6000, label: 'n90' },
    { type: 'ITEM_LISTED', itemId: 'tradepost-n90' },
    { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'mail' },
    { type: 'CLAIM_SELECTED', claimId: 'c3' },
    { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e2'] },
  ])
}

describe('day 01 gate', () => {
  it('stays shut until every beat has fired', () => {
    let state = fresh()
    expect(selectCanEndDay(state, content)).toBe(false)
    expect(selectOutstandingBeats(state, content)).toEqual([
      'readme',
      'marc',
      'recall',
      'money',
      'claim',
    ])

    state = dispatch(state, { type: 'FILE_OPENED', fileId: 'readme' })
    expect(state.beats.readme).toBe(true)
    expect(selectCanEndDay(state, content)).toBe(false)
    expect(selectOutstandingBeats(state, content)).toEqual(['marc', 'recall', 'money', 'claim'])
  })

  it('opens once all five have', () => {
    const state = playThroughRequirements()
    expect(state.beats).toMatchObject({
      readme: true,
      marc: true,
      recall: true,
      money: true,
      claim: true,
    })
    expect(selectCanEndDay(state, content)).toBe(true)
    expect(state.cashCents).toBe(71782)
  })

  it('answering the unknown handle does not count as answering Marc', () => {
    const state = run(fresh(), [
      { type: 'CHAT_STARTED', thread: 'unknown' },
      { type: 'CHAT_REPLY_SENT', thread: 'unknown', text: 'Who is this?' },
    ])
    expect(state.beats.marc).toBeUndefined()
  })

  it('ends the day by clearing the desk and turning the watcher on', () => {
    let state = playThroughRequirements()
    state = run(state, [
      { type: 'APP_OPENED', app: 'bank' },
      { type: 'PHONE_TOGGLED' },
      { type: 'TRAY_TOGGLED', open: true },
    ])
    expect(state.windows.length).toBeGreaterThan(0)

    state = dispatch(state, { type: 'DAY_ENDED' })
    expect(state.stage).toBe('day-end')
    expect(state.windows).toEqual([])
    expect(state.phone.open).toBe(false)
    expect(state.ui.trayOpen).toBe(false)
    expect(state.ui.watched).toBe(true)
    expect(state.ui.dayCard).toBe(false)
    expect(state.minuteOfDay).toBe(DAY_END_MINUTE)

    state = dispatch(state, { type: 'DAY_CARD_SHOWN' })
    expect(state.ui.dayCard).toBe(true)
  })

  it('the unknown mail quotes back whatever the player filed under their name', () => {
    let state = playThroughRequirements()
    state = dispatch(state, { type: 'CLAIM_ASSERTED', claimId: 'c4', evidenceIds: ['e2'] })
    state = dispatch(state, { type: 'DAY_ENDED' })

    const inbox = selectMail(state, content)
    expect(inbox[0]?.from).toBe('UNKNOWN')
    expect(inbox[0]?.body[1]).toContain('Marc works for the Aion Group.')
  })

  it('says something else when the record is clean', () => {
    const state = dispatch(playThroughRequirements(), { type: 'DAY_ENDED' })
    expect(selectMail(state, content)[0]?.body[1]).toBe('We read the quiet ones too.')
  })

  it('summarises the day honestly', () => {
    const state = dispatch(playThroughRequirements(), { type: 'DAY_ENDED' })
    const summary = selectDaySummary(state, content)
    expect(summary.balance).toBe('$717.82')
    expect(summary.quota).toBe('$10,000.00')
    expect(summary.daysLeft).toBe(29)
    expect(summary.integrity).toBe('91%')
    expect(summary.claimCount).toBe(0)
  })
})

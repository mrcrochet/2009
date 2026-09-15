import { describe, expect, it } from 'vitest'
import {
  selectReportSummary,
  selectEvidenceCards,
  selectFiles,
  selectDevices,
  selectMail,
  selectOutstandingBeats,
  selectPage,
  selectSearchResults,
} from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

/**
 * These selectors are what components subscribe to. If one of them returns a fresh reference
 * after an event it does not depend on, every app that reads it re-renders — typing one
 * character into Notes would reconcile the whole desktop.
 */
describe('selector stability', () => {
  const ALL = [
    ['selectMail', selectMail],
    ['selectPage', selectPage],
    ['selectFiles', selectFiles],
    ['selectDevices', selectDevices],
    ['selectEvidenceCards', selectEvidenceCards],
    ['selectSearchResults', selectSearchResults],
    ['selectOutstandingBeats', selectOutstandingBeats],
    ['selectReportSummary', selectReportSummary],
  ] as const

  it('an unrelated event does not invalidate anything', () => {
    const before = run(fresh(), [
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_NAVIGATED', url: 'fremontparking.com' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
    ])
    const first = ALL.map(([, fn]) => fn(before, content))

    const after = dispatch(before, { type: 'TRAY_TOGGLED', open: false })
    expect(after).not.toBe(before)

    ALL.forEach(([name, fn], i) => {
      expect(fn(after, content), `${name} was invalidated by an unrelated event`).toBe(first[i])
    })
  })

  /**
   * Typing into Notes is the case this whole memo exists for — but the report counts the
   * characters, so it is a real dependency of exactly one selector and of no other.
   */
  it('typing a note reaches the report and nothing else', () => {
    const before = run(fresh(), [{ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' }])
    const first = ALL.map(([, fn]) => fn(before, content))

    const after = dispatch(before, { type: 'NOTES_CHANGED', value: 'a note about the ninth' })

    ALL.forEach(([name, fn], i) => {
      if (name === 'selectReportSummary') {
        expect(fn(after, content), 'the report does not count what was written').not.toBe(first[i])
        return
      }
      expect(fn(after, content), `${name} was invalidated by a note`).toBe(first[i])
    })
  })

  it('moving a window does not invalidate anything either', () => {
    const before = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'devices' },
    ])
    const first = ALL.map(([, fn]) => fn(before, content))
    const after = dispatch(before, { type: 'WINDOW_MOVED', app: 'mail', x: 300, y: 200 })

    ALL.forEach(([name, fn], i) => {
      expect(fn(after, content), `${name} was invalidated by a window move`).toBe(first[i])
    })
  })

  it('but a related event does invalidate the selector that reads it', () => {
    const before = run(fresh(), [{ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' }])
    const cards = selectEvidenceCards(before, content)
    const devices = selectDevices(before, content)

    const after = dispatch(before, { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' })
    expect(selectEvidenceCards(after, content)).not.toBe(cards)
    // …and only that one.
    expect(selectDevices(after, content)).toBe(devices)
  })

  it('the browser page follows both its URL and what the investigator has done', () => {
    const base = dispatch(fresh(), {
      type: 'BROWSER_NAVIGATED',
      url: 'ridgelinepartners.com/team',
    })
    const page = selectPage(base, content)
    expect(selectPage(base, content)).toBe(page)

    const changed = dispatch(base, {
      type: 'CHAT_REPLY_SENT',
      thread: 'claire',
      text: 'I am going to call Vale.',
      setsFlag: 'valeNotified',
    })
    expect(selectPage(changed, content)).not.toBe(page)
  })

  it('reading the same state from two places does not thrash the cache', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
      { type: 'BOARD_TOGGLED', open: true },
    ])
    // The tray and the board both read this on the same render.
    const fromTray = selectEvidenceCards(state, content)
    const fromBoard = selectEvidenceCards(state, content)
    expect(fromBoard).toBe(fromTray)
  })
})

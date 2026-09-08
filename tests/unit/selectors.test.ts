import { describe, expect, it } from 'vitest'
import {
  selectDaySummary,
  selectEvidenceCards,
  selectFiles,
  selectLedger,
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
    ['selectLedger', selectLedger],
    ['selectEvidenceCards', selectEvidenceCards],
    ['selectSearchResults', selectSearchResults],
    ['selectOutstandingBeats', selectOutstandingBeats],
    ['selectDaySummary', selectDaySummary],
  ] as const

  it('an unrelated event does not invalidate anything', () => {
    const before = run(fresh(), [
      { type: 'APP_OPENED', app: 'web' },
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
    ])
    const first = ALL.map(([, fn]) => fn(before, content))

    const after = dispatch(before, { type: 'NOTES_CHANGED', value: 'a note about the 6th' })
    expect(after).not.toBe(before)

    ALL.forEach(([name, fn], i) => {
      expect(fn(after, content), `${name} was invalidated by an unrelated event`).toBe(first[i])
    })
  })

  it('moving a window does not invalidate anything either', () => {
    const before = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'bank' },
    ])
    const first = ALL.map(([, fn]) => fn(before, content))
    const after = dispatch(before, { type: 'WINDOW_MOVED', app: 'mail', x: 300, y: 200 })

    ALL.forEach(([name, fn], i) => {
      expect(fn(after, content), `${name} was invalidated by a window move`).toBe(first[i])
    })
  })

  it('but a related event does invalidate the selector that reads it', () => {
    const before = run(fresh(), [{ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' }])
    const cards = selectEvidenceCards(before, content)
    const ledger = selectLedger(before, content)

    const after = dispatch(before, { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' })
    expect(selectEvidenceCards(after, content)).not.toBe(cards)
    // …and only that one.
    expect(selectLedger(after, content)).toBe(ledger)
  })

  it('the browser page follows both its URL and the timeline it is being read in', () => {
    const base = dispatch(fresh(), {
      type: 'BROWSER_NAVIGATED',
      url: 'columbia-register.com/business',
    })
    const page = selectPage(base, content)
    expect(selectPage(base, content)).toBe(page)

    const shifted = run(base, [
      { type: 'RECALL_USED', query: 'bitcoin' },
      { type: 'RECALL_USED', query: 'amazon' },
    ])
    expect(selectPage(shifted, content)).not.toBe(page)
  })

  it('reading the same state from two places does not thrash the cache', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' },
      { type: 'BOARD_TOGGLED', open: true },
    ])
    // The tray and the board both read this on the same render.
    const fromTray = selectEvidenceCards(state, content)
    const fromBoard = selectEvidenceCards(state, content)
    expect(fromBoard).toBe(fromTray)
  })
})

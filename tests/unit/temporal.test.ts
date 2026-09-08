import { describe, expect, it } from 'vitest'
import {
  hasWitnessedShift,
  isPageAltered,
  resolveBlocks,
  resolveSearchEntry,
} from '@/engine/temporal'
import { selectDaySummary, selectPage } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

const article = content.browser.pages.find((p) => p.url === 'columbia-register.com/business')!

describe('temporal engine', () => {
  it('serves the authored article below the shift threshold', () => {
    const blocks = resolveBlocks(article, 1)
    expect(blocks[0]).toMatchObject({
      kind: 'heading',
      text: expect.stringContaining('plugin-free video'),
    })
    expect(isPageAltered(article, 1)).toBe(false)
  })

  it('rewrites the same URL at shift >= 2', () => {
    const blocks = resolveBlocks(article, 2)
    expect(blocks[0]).toMatchObject({
      kind: 'heading',
      text: expect.stringContaining('folds before demo'),
    })
    expect(blocks.at(-1)).toMatchObject({
      text: 'You have read this page before. It did not say this.',
    })
    expect(isPageAltered(article, 2)).toBe(true)
  })

  it('rewrites the search result too, so the world stays consistent', () => {
    const entry = content.browser.index.find((e) => e.id === 'idx-business')!
    expect(resolveSearchEntry(entry, 0).title).toContain('to demo plugin-free video')
    expect(resolveSearchEntry(entry, 2).title).toContain('folds before demo')
  })

  it('two recalls are enough to change what the player already read', () => {
    let state = run(fresh(), [{ type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/business' }])
    expect(selectPage(state, content).blocks[0]).toMatchObject({
      text: expect.stringContaining('plugin-free video'),
    })
    expect(hasWitnessedShift(content, state)).toBe(false)

    state = dispatch(state, { type: 'RECALL_USED', query: 'bitcoin' })
    state = dispatch(state, { type: 'RECALL_USED', query: 'amazon' })

    expect(state.temporalShift).toBe(2)
    expect(selectPage(state, content).blocks[0]).toMatchObject({
      text: expect.stringContaining('folds before demo'),
    })
    expect(hasWitnessedShift(content, state)).toBe(true)
    expect(selectDaySummary(state, content).shifted).toBe(true)
  })

  it('does not report a shift the player never saw', () => {
    const state = run(fresh(), [
      { type: 'RECALL_USED', query: 'bitcoin' },
      { type: 'RECALL_USED', query: 'amazon' },
    ])
    expect(state.temporalShift).toBe(2)
    expect(selectDaySummary(state, content).shifted).toBe(false)
  })

  it('registering a domain also moves the timeline', () => {
    const state = dispatch(fresh(), {
      type: 'DOMAIN_REGISTERED',
      domain: 'shortclip.com',
      amountCents: 995,
    })
    expect(state.temporalShift).toBe(1)
    expect(state.divergence).toBe(5)
  })
})

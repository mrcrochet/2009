import { describe, expect, it } from 'vitest'
import { selectPage, selectSearchResults } from '@/engine/selectors'
import { searchIndex } from '@/engine/rules'
import { content, dispatch, fresh, run } from './helpers'

describe('fictional browser', () => {
  it('searches its own closed index', () => {
    expect(searchIndex(content, 'phone')).toContain('idx-tradepost')
    expect(searchIndex(content, 'owen rask')).toContain('idx-obit')
    expect(searchIndex(content, 'zzzz nothing here')).toEqual([])
  })

  it('renders an empty-result state rather than reaching outside', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_SEARCHED', query: 'quantum computing stocks' })
    expect(state.browser.view).toBe('results')
    expect(selectSearchResults(state, content)).toEqual([])
  })

  it('keeps a real back-stack', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_SEARCHED', query: 'rask' },
      { type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/obits/rask' },
    ])
    expect(state.browser.view).toBe('page')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('results')
    expect(state.browser.query).toBe('rask')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('home')
    expect(state.browser.url).toBe('corvid.com')
  })

  it('typing an unknown address gives a period-appropriate not-found, not a crash', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'google.com' })
    expect(selectPage(state, content).found).toBe(false)
  })

  it('costs time to browse', () => {
    const before = fresh()
    const after = run(before, [
      { type: 'BROWSER_SEARCHED', query: 'rask' },
      { type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/obits/rask' },
    ])
    expect(after.minuteOfDay - before.minuteOfDay).toBe(3)
  })
})

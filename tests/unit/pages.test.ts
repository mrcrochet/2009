import { describe, expect, it } from 'vitest'
import { hasWitnessedChange, isPageAltered, resolveBlocks, resolveSearchEntry } from '@/engine/pages'
import { selectReportSummary, selectPage } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

const team = content.browser.pages.find((p) => p.url === 'ridgelinepartners.com/team')!

/**
 * Pages change because of something the investigator did, not because a meter crossed a
 * threshold. The variant this case authors is a firm quietly editing its own website after
 * somebody called it.
 */
describe('pages that change', () => {
  it('serves the authored page while the flag is unset', () => {
    const blocks = resolveBlocks(team, {})
    expect(blocks.some((b) => 'text' in b && b.text.includes('Marlow Foundation'))).toBe(true)
    expect(isPageAltered(team, {})).toBe(false)
  })

  it('serves a different page once the flag is set', () => {
    const blocks = resolveBlocks(team, { valeNotified: true })
    expect(blocks.some((b) => 'text' in b && b.text.includes('Marlow Foundation'))).toBe(false)
    expect(isPageAltered(team, { valeNotified: true })).toBe(true)
  })

  it('rewrites the search result too, so the world stays consistent', () => {
    const entry = content.browser.index.find((e) => e.id === 'i-vale')!
    expect(resolveSearchEntry(entry, {}).snippet).toContain('boards of several Oregon')
    expect(resolveSearchEntry(entry, { valeNotified: true }).snippet).not.toContain(
      'boards of several Oregon',
    )
  })

  it('one telephone call is enough to change what the player already read', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'ridgelinepartners.com/team' },
    ])
    expect(
      selectPage(state, content).blocks.some(
        (b) => 'text' in b && b.text.includes('Marlow Foundation'),
      ),
    ).toBe(true)
    expect(hasWitnessedChange(content, [state.browser.url], state.flags)).toBe(false)

    state = run(state, [
      { type: 'THREAD_SELECTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'claire' },
      { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'Tell me about Sunday.' },
      { type: 'CHAT_ADVANCED', thread: 'claire' },
      {
        type: 'CHAT_REPLY_SENT',
        thread: 'claire',
        text: 'I am going to call Vale.',
        setsFlag: 'valeNotified',
      },
    ])

    expect(state.flags.valeNotified).toBe(true)
    expect(
      selectPage(state, content).blocks.some(
        (b) => 'text' in b && b.text.includes('Marlow Foundation'),
      ),
    ).toBe(false)
    expect(selectReportSummary(state, content).changed).toBe(true)
  })

  it('does not report a change the player never saw', () => {
    const state = dispatch(fresh(), {
      type: 'CHAT_REPLY_SENT',
      thread: 'claire',
      text: 'I am going to call Vale.',
      setsFlag: 'valeNotified',
    })
    expect(state.flags.valeNotified).toBe(true)
    expect(selectReportSummary(state, content).changed).toBe(false)
  })
})

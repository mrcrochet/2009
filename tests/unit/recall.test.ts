import { describe, expect, it } from 'vitest'
import { resolveRecall } from '@/engine/rules'
import { content, dispatch, fresh } from './helpers'

describe('recall', () => {
  it('costs exactly nine coherence per retrieval', () => {
    let state = fresh()
    state = dispatch(state, { type: 'RECALL_USED', query: 'bitcoin' })
    expect(state.memoryIntegrity).toBe(91)
    expect(state.recalls[0]?.cost).toBe(9)
    state = dispatch(state, { type: 'RECALL_USED', query: 'amazon' })
    expect(state.memoryIntegrity).toBe(82)
  })

  it('floors at 24 and never goes lower', () => {
    let state = fresh()
    for (let i = 0; i < 30; i += 1) {
      state = dispatch(state, { type: 'RECALL_USED', query: 'bitcoin' })
    }
    expect(state.memoryIntegrity).toBe(24)
    expect(state.recalls[0]?.cost).toBe(0)
  })

  it('degrades one step below 78 and fractures below 52', () => {
    expect(resolveRecall(content, 'bitcoin', 100).confidence).toBe('HIGH')

    const degraded = resolveRecall(content, 'bitcoin', 86) // → 77
    expect(degraded.confidence).toBe('MEDIUM')
    expect(degraded.text).toContain('has moved since you last checked it')

    const fractured = resolveRecall(content, 'bitcoin', 60) // → 51
    expect(fractured.confidence).toBe('FRACTURED')
    expect(fractured.text).toContain('two incompatible versions')
  })

  it('returns no recollection rather than inventing an outcome', () => {
    const outcome = resolveRecall(content, 'what wins the 2019 world series', 100)
    expect(outcome.confidence).toBe('NONE')
    expect(outcome.memoryId).toBeNull()
    expect(outcome.text).toBe(content.recall.noMatchText)
  })

  it('keeps NONE-confidence memories at NONE however degraded', () => {
    const outcome = resolveRecall(content, 'aion', 30)
    expect(outcome.confidence).toBe('NONE')
    expect(outcome.text).not.toContain('incompatible versions')
  })

  it('prefers the longest matching key', () => {
    expect(resolveRecall(content, 'lea voss', 100).memoryId).not.toBe('mem-crash')
  })

  it('moves the timeline and fires its beat', () => {
    const state = dispatch(fresh(), { type: 'RECALL_USED', query: 'tesla' })
    expect(state.temporalShift).toBe(1)
    expect(state.divergence).toBe(2)
    expect(state.beats.recall).toBe(true)
    expect(state.recallQuery).toBe('')
  })
})

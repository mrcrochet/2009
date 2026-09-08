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

  it('prefers the longest matching key, and does not shadow its neighbours', () => {
    // `gold price` and `goldman sachs` share a prefix; only the first is a memory.
    expect(resolveRecall(content, 'gold price', 100).memoryId).toBe('mem-metals')
    expect(resolveRecall(content, 'goldman sachs', 100).memoryId).toBeNull()
    // `bet` would have swallowed `alphabet`; the keys are chosen so it cannot.
    expect(resolveRecall(content, 'alphabet', 100).memoryId).toBe('mem-google')
  })

  it('answers a question, not just a keyword', () => {
    // Every existing test passed an exact key, so replacing the substring matcher with
    // equality passed the whole suite. This is what a player actually types.
    const asked: [string, string][] = [
      ['tell me about bitcoin', 'mem-bitcoin'],
      ['what happens to apple', 'mem-apple'],
      ['was there a pandemic', 'mem-pandemic'],
      ['is the housing crash over', 'mem-crash'],
      ['who wins the election', 'mem-election'],
      ['should i buy google', 'mem-google'],
    ]
    for (const [query, memoryId] of asked) {
      expect(resolveRecall(content, query, 100).memoryId, query).toBe(memoryId)
    }
  })

  it('moves the timeline and fires its beat', () => {
    const state = dispatch(fresh(), { type: 'RECALL_USED', query: 'tesla' })
    expect(state.temporalShift).toBe(1)
    expect(state.divergence).toBe(2)
    expect(state.beats.recall).toBe(true)
    expect(state.recallQuery).toBe('')
  })
})

/**
 * The library is the whole mechanic. If a player types something obvious and gets "No
 * recollection", the fiction breaks — the narrator is supposed to be a person who remembers
 * 2026, not a lookup table with holes in it.
 */
describe('the memory library', () => {
  it('answers for every ticker the player can see in Quoteline', () => {
    for (const quote of content.economy.quotes) {
      const outcome = resolveRecall(content, quote.symbol, 100)
      expect(outcome.memoryId, `${quote.symbol} is on screen and returns nothing`).not.toBeNull()
    }
  })

  it('answers the things a 2026 player types first', () => {
    const expected: Record<string, string> = {
      google: 'mem-google',
      youtube: 'mem-google',
      alphabet: 'mem-google',
      microsoft: 'mem-microsoft',
      windows: 'mem-microsoft',
      obama: 'mem-election',
      inauguration: 'mem-election',
      'super bowl': 'mem-superbowl',
      steelers: 'mem-superbowl',
      lottery: 'mem-lottery',
      powerball: 'mem-lottery',
      covid: 'mem-pandemic',
      pandemic: 'mem-pandemic',
      twitter: 'mem-twitter',
      chatgpt: 'mem-ai',
      'artificial intelligence': 'mem-ai',
      uber: 'mem-private',
      airbnb: 'mem-private',
      'gold price': 'mem-metals',
      djia: 'mem-crash',
    }
    for (const [query, memoryId] of Object.entries(expected)) {
      expect(resolveRecall(content, query, 100).memoryId, `"${query}"`).toBe(memoryId)
    }
  })

  it('gives twitter its own answer instead of answering about Facebook', () => {
    const outcome = resolveRecall(content, 'twitter', 100)
    expect(outcome.memoryId).toBe('mem-twitter')
    expect(outcome.text).not.toContain('blue bar')
  })

  it('resolves every key to the memory that owns it', () => {
    // The matcher does substring matching, so a short key can silently swallow a longer
    // query belonging to a different memory.
    for (const memory of content.memories) {
      for (const key of memory.keys) {
        expect(resolveRecall(content, key, 100).memoryId, `key "${key}"`).toBe(memory.id)
      }
    }
  })

  it('shares no key between two memories', () => {
    const owner = new Map<string, string>()
    for (const memory of content.memories) {
      for (const key of memory.keys) {
        const existing = owner.get(key)
        expect(existing, `"${key}" is claimed by both ${existing} and ${memory.id}`).toBeUndefined()
        owner.set(key, memory.id)
      }
    }
  })

  it('refuses the lottery, and refuses it without leaking a digit', () => {
    const outcome = resolveRecall(content, 'powerball', 100)
    expect(outcome.confidence).toBe('NONE')
    expect(outcome.text).not.toMatch(/\d/)
  })

  it('withholds the number on the one result that could be bet on', () => {
    const outcome = resolveRecall(content, 'super bowl', 100)
    expect(outcome.text).toContain('not certain about the number')
    expect(outcome.text).not.toMatch(/\d+\s*[-–]\s*\d+/)
  })

  it('keeps at least one memory the player wants and cannot have', () => {
    const refusals = content.memories.filter((m) => m.confidence === 'NONE')
    expect(refusals.length).toBeGreaterThanOrEqual(2)
  })

  it('is written in one voice', () => {
    for (const memory of content.memories) {
      expect(memory.text, memory.id).not.toContain('!')
      // Second person, present tense — no first-person narrator ever appears.
      expect(memory.text, memory.id).not.toMatch(/\bI\b|\bmy\b/)
      expect(memory.text.length, `${memory.id} is too thin`).toBeGreaterThan(60)
    }
  })
})

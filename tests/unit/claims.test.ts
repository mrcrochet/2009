import { describe, expect, it } from 'vitest'
import { evaluateClaim } from '@/engine/rules'
import { selectChoices } from '@/engine/selectors'
import type { Claim } from '@/engine/types'
import { content, dispatch, fresh, run } from './helpers'

const claim = (id: string) => content.claims.find((c) => c.id === id) as Claim

describe('claims', () => {
  it('accepts a sound claim with its exact evidence set', () => {
    const outcome = evaluateClaim(claim('c2'), ['e3', 'e4'])
    expect(outcome.verdict).toBe('accepted')
    expect(outcome.onRecord).toBe(false)
    expect(outcome.message).toContain('ACCEPTED')
  })

  it('rejects an incomplete set', () => {
    expect(evaluateClaim(claim('c2'), ['e3']).verdict).toBe('insufficient')
  })

  it('rejects a superset — relying on more than the claim needs is still wrong', () => {
    expect(evaluateClaim(claim('c2'), ['e3', 'e4', 'e1']).verdict).toBe('insufficient')
  })

  it('ignores ordering', () => {
    expect(evaluateClaim(claim('c1'), ['e6', 'e5']).verdict).toBe('accepted')
  })

  it('always refuses an unsound claim and puts it on the record', () => {
    const supported = evaluateClaim(claim('c4'), ['e7', 'e2', 'e8'])
    expect(supported.verdict).toBe('refused')
    expect(supported.onRecord).toBe(true)

    const unsupported = evaluateClaim(claim('c4'), ['e2'])
    expect(unsupported.verdict).toBe('refused')
    expect(unsupported.onRecord).toBe(true)
  })

  it('logs only refused claims, and charges heat for them', () => {
    let state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
      { type: 'CLAIM_SELECTED', claimId: 'c2' },
      { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: ['e3', 'e4'] },
    ])
    expect(state.lastVerdict?.verdict).toBe('accepted')
    expect(state.claimLog).toHaveLength(0)
    expect(state.heat).toBe(0)
    expect(state.beats.claim).toBe(true)

    state = dispatch(state, {
      type: 'CLAIM_ASSERTED',
      claimId: 'c4',
      evidenceIds: ['e7', 'e2', 'e8'],
    })
    expect(state.claimLog).toHaveLength(1)
    expect(state.claimLog[0]?.claimText).toBe('Marc works for the Aion Group.')
    expect(state.heat).toBe(10)
  })

  it('costs six minutes to put an assertion on the record', () => {
    const before = fresh()
    const after = dispatch(before, { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e2'] })
    expect(after.minuteOfDay - before.minuteOfDay).toBe(6)
  })
})

describe('choices that answer themselves', () => {
  function ask(threadId: 'marc' | 'lea', text: string, extra: Record<string, unknown> = {}) {
    let state = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: threadId },
      { type: 'CHAT_STARTED', thread: threadId },
    ])
    state = dispatch(state, { type: 'CHAT_REPLY_SENT', thread: threadId, text, ...extra })
    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: threadId })
    return state.chat.log[threadId].map((l) => l.text)
  }

  it('answers the question that was asked', () => {
    const lines = ask('marc', 'What kind of thing?', {
      reply:
        'nothing that needs a name. you drive, you hand over cash, you sell it on. thats the whole job',
    })
    expect(lines[2]).toContain('nothing that needs a name')
    // …and then he changes the subject, which is the script moving on.
    expect(lines[3]).toContain('tradepost')
  })

  it('a choice can hold the conversation where it is', () => {
    const held = ask('marc', 'Where were you last night?', {
      reply: 'home. why',
      advances: false,
    })
    expect(held[2]).toBe('home. why')
    expect(held).toHaveLength(3)
  })

  it('a choice can change the world outside the conversation', () => {
    let state = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: 'lea' },
      { type: 'CHAT_STARTED', thread: 'lea' },
    ])
    expect(state.flags.leaPostRemoved).toBeUndefined()
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'lea',
      text: 'Take the post down.',
      reply: 'ok. taken down.',
      setsFlag: 'leaPostRemoved',
    })
    expect(state.flags.leaPostRemoved).toBe(true)
  })

  it('withholds the accusation until the player can prove it', () => {
    const before = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: 'marc' },
      { type: 'CHAT_STARTED', thread: 'marc' },
    ])
    expect(selectChoices(before, content).map((c) => c.text)).toEqual(['What kind of thing?'])

    const after = dispatch(before, { type: 'EVIDENCE_PINNED', evidenceId: 'e6', via: 'phone' })
    expect(selectChoices(after, content).map((c) => c.text)).toContain('Where were you last night?')
  })
})

describe('two conversations at once', () => {
  it('one thread cannot answer with another thread’s line', () => {
    let state = run(fresh(), [
      { type: 'CHAT_STARTED', thread: 'marc' },
      { type: 'CHAT_STARTED', thread: 'lea' },
    ])
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'marc',
      text: 'q',
      reply: 'MARC-ANSWER',
    })
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'lea',
      text: 'q',
      reply: 'LEA-ANSWER',
    })
    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: 'marc' })

    expect(state.chat.log.marc.map((l) => l.text)).toContain('MARC-ANSWER')
    expect(state.chat.log.marc.map((l) => l.text)).not.toContain('LEA-ANSWER')

    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: 'lea' })
    expect(state.chat.log.lea.map((l) => l.text)).toContain('LEA-ANSWER')
  })

  it('only the thread being answered is waiting', () => {
    let state = run(fresh(), [{ type: 'CHAT_STARTED', thread: 'marc' }])
    state = dispatch(state, { type: 'CHAT_REPLY_SENT', thread: 'marc', text: 'q', reply: 'a' })
    expect(state.chat.waiting.marc).toBe(true)
    expect(state.chat.waiting.lea).toBe(false)

    // Switching tabs mid-reply must not freeze the other composers.
    state = dispatch(state, { type: 'THREAD_SELECTED', thread: 'lea' })
    state = dispatch(state, { type: 'CHAT_STARTED', thread: 'lea' })
    expect(selectChoices(state, content).length).toBeGreaterThan(0)
  })
})

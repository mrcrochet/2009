import { describe, expect, it } from 'vitest'
import { evaluateClaim } from '@/engine/rules'
import { selectChoices } from '@/engine/selectors'
import type { Claim } from '@/engine/types'
import { content, dispatch, fresh, run } from './helpers'

const claim = (id: string) => content.claims.find((c) => c.id === id) as Claim

describe('claims', () => {
  it('accepts a sound claim with its exact evidence set', () => {
    const outcome = evaluateClaim(claim('c2'), ['e2', 'e7'])
    expect(outcome.verdict).toBe('accepted')
    expect(outcome.onRecord).toBe(false)
  })

  it('rejects an incomplete set', () => {
    expect(evaluateClaim(claim('c2'), ['e2']).verdict).toBe('insufficient')
  })

  it('rejects a superset — relying on more than the claim needs is still wrong', () => {
    expect(evaluateClaim(claim('c2'), ['e2', 'e7', 'e1']).verdict).toBe('insufficient')
  })

  it('ignores ordering', () => {
    expect(evaluateClaim(claim('c1'), ['e5', 'e4', 'e3']).verdict).toBe('accepted')
  })

  it('always refuses an unsound claim and puts it on the record', () => {
    const supported = evaluateClaim(claim('c3'), ['e1', 'e3'])
    expect(supported.verdict).toBe('refused')
    expect(supported.onRecord).toBe(true)

    const unsupported = evaluateClaim(claim('c3'), ['e1'])
    expect(unsupported.verdict).toBe('refused')
    expect(unsupported.onRecord).toBe(true)
  })

  it('logs only refused claims, and charges exposure for them', () => {
    let state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'files' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e7', via: 'terminal' },
      { type: 'CLAIM_SELECTED', claimId: 'c2' },
      { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: ['e2', 'e7'] },
    ])
    expect(state.lastVerdict?.verdict).toBe('accepted')
    expect(state.claimLog).toHaveLength(0)
    expect(state.exposure).toBe(0)
    expect(state.beats.claim).toBe(true)

    state = run(state, [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
      { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e1', 'e3'] },
    ])
    expect(state.claimLog).toHaveLength(1)
    expect(state.claimLog[0]?.claimText).toBe(
      'Daniel Mercer left Portland of his own accord.',
    )
    expect(state.exposure).toBe(10)
  })

  it('costs six minutes to put an assertion on the record', () => {
    const before = fresh()
    const after = dispatch(before, { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: [] })
    expect(after.minute - before.minute).toBe(6)
  })
})

describe('a claim rests on what the player holds', () => {
  /**
   * The tray offers nothing the player has not pinned, so in play this changes nothing. It is
   * what makes "this claim needs what you found" a fact about the engine rather than a fact
   * about the user interface — and it is the difference between a save that can be edited into
   * an accepted claim and one that cannot.
   */
  it('ignores evidence that was never found', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'files' },
      { type: 'CLAIM_SELECTED', claimId: 'c2' },
      // c2 needs e2 and e7. Only e2 has been pinned.
      { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: ['e2', 'e7'] },
    ])
    expect(state.lastVerdict?.verdict).toBe('insufficient')
    // And the record says what was actually put on it, not what was claimed.
    expect(state.lastVerdict?.evidenceIds).toEqual(['e2'])
  })

  it('accepts the same claim once both are in the tray', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'files' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e7', via: 'terminal' },
      { type: 'CLAIM_SELECTED', claimId: 'c2' },
      { type: 'CLAIM_ASSERTED', claimId: 'c2', evidenceIds: ['e2', 'e7'] },
    ])
    expect(state.lastVerdict?.verdict).toBe('accepted')
  })
})

describe('choices that answer themselves', () => {
  function ask(threadId: 'claire' | 'unknown', text: string, extra: Record<string, unknown> = {}) {
    let state = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: threadId },
      { type: 'CHAT_STARTED', thread: threadId },
    ])
    state = dispatch(state, { type: 'CHAT_REPLY_SENT', thread: threadId, text, ...extra })
    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: threadId })
    return (state.chat.log[threadId] ?? []).map((l) => l.text)
  }

  it('answers the question that was asked', () => {
    const lines = ask('claire', 'There is a receipt in what you sent. Where did it come from?', {
      reply: 'His coat. The grey one, on the hook. He wore it that night.',
    })
    expect(lines[2]).toContain('His coat')
    // …and then she moves on, which is the script advancing.
    expect(lines[3]).toContain('home by seven')
  })

  it('a choice can hold the conversation where it is', () => {
    const held = ask('unknown', 'Who is this?', {
      reply: 'Somebody who has read this file before you did.',
      advances: false,
    })
    expect(held[2]).toBe('Somebody who has read this file before you did.')
    expect(held).toHaveLength(3)
  })

  it('a choice can change the world outside the conversation', () => {
    let state = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'claire' },
    ])
    expect(state.flags.valeNotified).toBeUndefined()
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'claire',
      text: 'I am going to call Vale.',
      reply: 'Do it.',
      setsFlag: 'valeNotified',
    })
    expect(state.flags.valeNotified).toBe(true)
  })

  it('withholds the accusation until the player can prove it', () => {
    const before = run(fresh(), [
      { type: 'THREAD_SELECTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'claire' },
      { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'Tell me about Sunday.' },
      { type: 'CHAT_ADVANCED', thread: 'claire' },
    ])
    const gated = 'Vale was on the Marlow board in 2013. Daniel found that too.'
    expect(selectChoices(before, content).map((c) => c.text)).not.toContain(gated)

    const after = dispatch(before, { type: 'EVIDENCE_PINNED', evidenceId: 'e7', via: 'terminal' })
    expect(selectChoices(after, content).map((c) => c.text)).toContain(gated)
  })
})

describe('two conversations at once', () => {
  it('one thread cannot answer with another thread’s line', () => {
    let state = run(fresh(), [
      { type: 'CHAT_STARTED', thread: 'claire' },
      { type: 'CHAT_STARTED', thread: 'unknown' },
    ])
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'claire',
      text: 'q',
      reply: 'CLAIRE-ANSWER',
    })
    state = dispatch(state, {
      type: 'CHAT_REPLY_SENT',
      thread: 'unknown',
      text: 'q',
      reply: 'UNKNOWN-ANSWER',
    })
    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: 'claire' })

    expect(state.chat.log.claire!.map((l) => l.text)).toContain('CLAIRE-ANSWER')
    expect(state.chat.log.claire!.map((l) => l.text)).not.toContain('UNKNOWN-ANSWER')

    state = dispatch(state, { type: 'CHAT_ADVANCED', thread: 'unknown' })
    expect(state.chat.log.unknown!.map((l) => l.text)).toContain('UNKNOWN-ANSWER')
  })

  it('only the thread being answered is waiting', () => {
    let state = run(fresh(), [{ type: 'CHAT_STARTED', thread: 'claire' }])
    state = dispatch(state, { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'q', reply: 'a' })
    expect(state.chat.waiting.claire).toBe(true)
    expect(state.chat.waiting.unknown).toBe(false)

    // Switching tabs mid-reply must not freeze the other composers.
    state = dispatch(state, { type: 'THREAD_SELECTED', thread: 'unknown' })
    state = dispatch(state, { type: 'CHAT_STARTED', thread: 'unknown' })
    expect(selectChoices(state, content).length).toBeGreaterThan(0)
  })
})

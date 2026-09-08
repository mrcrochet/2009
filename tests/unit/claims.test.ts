import { describe, expect, it } from 'vitest'
import { evaluateClaim } from '@/engine/rules'
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

    state = dispatch(state, { type: 'CLAIM_ASSERTED', claimId: 'c4', evidenceIds: ['e7', 'e2', 'e8'] })
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

import { describe, expect, it } from 'vitest'
import { selectEvidenceCards } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

describe('evidence', () => {
  it('pins idempotently and opens the tray', () => {
    let state = fresh()
    expect(state.ui.trayOpen).toBe(false)

    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' })
    expect(state.evidence).toHaveLength(1)
    expect(state.ui.trayOpen).toBe(true)

    const afterFirst = state
    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files' })
    expect(state.evidence).toHaveLength(1)
    expect(state).toBe(afterFirst)
  })

  it('records where and when each piece came from', () => {
    let state = fresh()
    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e6', via: 'phone' })
    const pinned = state.evidence[0]
    expect(pinned?.discoveredBy).toBe('phone')
    expect(pinned?.discoveredAt).toBe(452)
  })

  it('every authored claim can actually be assembled from reachable evidence', () => {
    const reachable = new Set<string>()
    for (const m of content.mail) if (m.evidenceId) reachable.add(m.evidenceId)
    for (const f of content.files) if (f.evidenceId) reachable.add(f.evidenceId)
    for (const p of content.browser.pages)
      for (const b of p.blocks) if (b.kind === 'evidence') reachable.add(b.evidenceId)
    for (const p of content.phone.photos) if (p.evidenceId) reachable.add(p.evidenceId)
    for (const s of content.phone.sms) if (s.evidenceId) reachable.add(s.evidenceId)
    for (const l of content.economy.openingLedger) if (l.evidenceId) reachable.add(l.evidenceId)
    reachable.add(content.terminal.decrypt.evidenceId)

    for (const claim of content.claims) {
      for (const need of claim.need) {
        expect(reachable.has(need), `${claim.id} needs unreachable evidence ${need}`).toBe(true)
      }
    }
  })

  it('projects pinned evidence into cards with reliability', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
      { type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: 'e3' },
    ])
    const cards = selectEvidenceCards(state, content)
    expect(cards.map((c) => c.id)).toEqual(['e3', 'e4'])
    expect(cards[0]?.selected).toBe(true)
    expect(cards[0]?.reliability).toBe('documentary')
  })
})

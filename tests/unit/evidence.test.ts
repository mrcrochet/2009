import { describe, expect, it } from 'vitest'
import { isWithheld, selectEvidenceCards, selectFiles } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

describe('evidence', () => {
  it('pins idempotently and opens the tray', () => {
    let state = fresh()
    expect(state.ui.trayOpen).toBe(false)

    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' })
    expect(state.evidence).toHaveLength(1)
    expect(state.ui.trayOpen).toBe(true)

    const afterFirst = state
    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' })
    expect(state.evidence).toHaveLength(1)
    expect(state).toBe(afterFirst)
  })

  it('records where and when each piece came from', () => {
    let state = fresh()
    state = dispatch(state, { type: 'EVIDENCE_PINNED', evidenceId: 'e6', via: 'phone' })
    const pinned = state.evidence[0]
    expect(pinned?.discoveredBy).toBe('phone')
    expect(pinned?.discoveredAt).toBe(0)
  })

  it('every authored claim can actually be assembled from reachable evidence', () => {
    const reachable = new Set<string>()
    for (const m of content.mail) if (m.evidenceId) reachable.add(m.evidenceId)
    for (const f of content.files) if (f.evidenceId) reachable.add(f.evidenceId)
    for (const p of content.browser.pages)
      for (const b of p.blocks) if (b.kind === 'evidence') reachable.add(b.evidenceId)
    for (const p of content.photos) if (p.evidenceId) reachable.add(p.evidenceId)
    for (const s of content.phone?.sms ?? []) if (s.evidenceId) reachable.add(s.evidenceId)
    reachable.add(content.terminal.decrypt.evidenceId)

    for (const claim of content.claims) {
      for (const need of claim.need) {
        expect(reachable.has(need), `${claim.id} needs unreachable evidence ${need}`).toBe(true)
      }
    }
  })

  it('projects pinned evidence into cards with reliability', () => {
    const state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'browser' },
      { type: 'EVIDENCE_SELECTION_TOGGLED', evidenceId: 'e3' },
    ])
    const cards = selectEvidenceCards(state, content)
    expect(cards.map((c) => c.id)).toEqual(['e3', 'e4'])
    expect(cards[0]?.selected).toBe(true)
    expect(cards[0]?.reliability).toBe('documentary')
  })
})

/**
 * The paywall, from the engine's side.
 *
 * The grant is the server's. What is checked here is that the engine agrees with it — because
 * "the pin button was not rendered" is a rendering, and a save can be edited.
 */
describe('evidence behind a forensic service', () => {
  const gated = content.services[0]!

  it('cannot be pinned before the service is granted', () => {
    const state = dispatch(fresh(), {
      type: 'EVIDENCE_PINNED',
      evidenceId: gated.grantsEvidenceIds[0]!,
      via: 'device',
    })
    expect(state.evidence).toHaveLength(0)
  })

  it('can be pinned once it is', () => {
    const state = dispatch(fresh('playing', [gated.id]), {
      type: 'EVIDENCE_PINNED',
      evidenceId: gated.grantsEvidenceIds[0]!,
      via: 'device',
    })
    expect(state.evidence).toHaveLength(1)
  })

  it('a recovered document is not on the disk until it has been recovered', () => {
    const before = selectFiles(fresh(), content).map((f) => f.id)
    const after = selectFiles(fresh('playing', [gated.id]), content).map((f) => f.id)
    for (const fileId of gated.grantsFileIds) {
      expect(before).not.toContain(fileId)
      expect(after).toContain(fileId)
    }
  })

  it('withholds nothing the case did not put behind a service', () => {
    expect(isWithheld(fresh(), content, 'evidence', 'e1')).toBe(false)
    expect(isWithheld(fresh(), content, 'evidence', gated.grantsEvidenceIds[0]!)).toBe(true)
  })

  it('a granted service is recorded, once', () => {
    let state = dispatch(fresh(), { type: 'SERVICE_GRANTED', serviceId: gated.id })
    expect(state.services).toEqual([gated.id])
    const again = dispatch(state, { type: 'SERVICE_GRANTED', serviceId: gated.id })
    expect(again).toBe(state)
    // A service this case never authored is not a service.
    state = dispatch(state, { type: 'SERVICE_GRANTED', serviceId: 'svc-invented' })
    expect(state.services).toEqual([gated.id])
  })
})

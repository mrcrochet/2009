import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CUES } from '@/lib/audio/cues'
import type { Cue } from '@/lib/audio/engine'
import { isMuted, setMuted, subscribeMuted } from '@/lib/audio'
import { cueForEvent } from '@/components/game/useGameSound'
import { content, dispatch, fresh, run } from './helpers'

describe('sound', () => {
  beforeEach(() => {
    setMuted(false)
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
  })

  it('is optional and remembers being turned off', () => {
    expect(isMuted()).toBe(false)
    const seen: boolean[] = []
    const unsubscribe = subscribeMuted((m) => seen.push(m))

    setMuted(true)
    expect(isMuted()).toBe(true)
    expect(seen).toEqual([true])
    expect(window.localStorage.getItem('two009:muted')).toBe('1')

    unsubscribe()
    setMuted(false)
    expect(seen).toEqual([true])
  })

  it('never throws when there is no AudioContext', () => {
    const original = window.AudioContext
    // jsdom has no Web Audio at all, which is exactly the hostile case.
    expect(() => cueForEvent({ type: 'BOOT_COMPLETED', at: 0 }, fresh())?.()).not.toThrow()
    expect(original).toBeUndefined()
  })

  it('never reaches for the speaker while muted', () => {
    const construct = vi.fn()
    class FakeContext {
      constructor() {
        construct()
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeContext, configurable: true })
    try {
      setMuted(true)
      cueForEvent({ type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'files', at: 0 }, fresh())?.()
      expect(construct).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(window, 'AudioContext')
      setMuted(false)
    }
  })

  it('every cue is short enough to be a system sound, and audible', () => {
    for (const [name, cue] of Object.entries(CUES) as [string, Cue][]) {
      const end = Math.max(
        0,
        ...cue.tones.map((t) => t.at + t.duration),
        ...(cue.noise ?? []).map((n) => n.at + n.duration),
      )
      expect(end, `${name} runs too long`).toBeLessThanOrEqual(2.5)
      expect(end, `${name} is silent`).toBeGreaterThan(0)
      for (const tone of cue.tones) {
        expect(tone.gain, `${name} tone is inaudible or clipping`).toBeGreaterThan(0)
        expect(tone.gain).toBeLessThanOrEqual(0.4)
        expect(tone.from).toBeGreaterThan(20)
      }
    }
  })

  it('only startup and the day-end sting are allowed to linger', () => {
    // Everything the player triggers themselves has to get out of the way immediately.
    const longCues = Object.entries(CUES).filter(([, cue]) =>
      cue.tones.some((t) => t.at + t.duration > 0.7),
    )
    expect(longCues.map(([name]) => name).sort()).toEqual(['boot', 'watched'])
  })

  it('a refused claim does not sound like an accepted one', () => {
    let state = run(fresh(), [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
    ])
    const accepted = {
      type: 'CLAIM_ASSERTED' as const,
      claimId: 'c2',
      evidenceIds: ['e3', 'e4'],
      at: 0,
    }
    state = dispatch(state, accepted)
    expect(state.lastVerdict?.verdict).toBe('accepted')
    expect(cueForEvent(accepted, state)).not.toBeNull()

    const refused = { type: 'CLAIM_ASSERTED' as const, claimId: 'c4', evidenceIds: ['e3'], at: 0 }
    const after = dispatch(state, refused)
    expect(after.lastVerdict?.verdict).toBe('refused')
    // Different verdicts must not resolve to the same cue.
    expect(cueForEvent(accepted, state)?.toString()).not.toBe(
      cueForEvent(refused, after)?.toString(),
    )
    void content
  })

  it('a successful command is silent; a rejected one is not', () => {
    const ok = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'ls' })
    expect(cueForEvent({ type: 'TERMINAL_COMMAND_RUN', command: 'ls', at: 0 }, ok)).toBeNull()

    const bad = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'sudo' })
    expect(
      cueForEvent({ type: 'TERMINAL_COMMAND_RUN', command: 'sudo', at: 0 }, bad),
    ).not.toBeNull()
  })
})

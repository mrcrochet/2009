import { hashSeed, mulberry32 } from '@/engine/seed'
import { CUES, type CueName } from './cues'
import {
  isMuted,
  play,
  setMuted,
  subscribeMuted,
  unlockAudio,
  type NoiseBurst,
  type PlayOptions,
  type Tone,
} from './engine'

export function playCue(name: CueName, options?: PlayOptions): void {
  play(CUES[name], options)
}

/**
 * A phrase of muffled speech, for a recording playing back through one small speaker.
 *
 * No voice ships, and none is faked: what this makes is the *shape* of somebody talking — a run
 * of syllables under a low cutoff, the way a voicemail sounds from across a room. The words are
 * on screen. A player who turns the sound off loses nothing but the room.
 *
 * Derived from the line's own text, so the same sentence sounds the same every time it is
 * played and in a replay of the session.
 */
export function playPhrase(seed: string, seconds: number): void {
  const rand = mulberry32(hashSeed(seed))
  const noise: NoiseBurst[] = []
  const tones: Tone[] = []
  let at = 0
  const span = Math.max(0.2, Math.min(2.4, seconds))
  while (at < span) {
    const duration = 0.06 + rand() * 0.11
    noise.push({ at, duration, gain: 0.1 + rand() * 0.1, cutoff: 500 + rand() * 420 })
    // One low tone under the burst carries the pitch of a voice without ever being a word.
    tones.push({
      from: 92 + rand() * 46,
      to: 88 + rand() * 46,
      wave: 'triangle',
      at,
      duration,
      gain: 0.05 + rand() * 0.04,
    })
    at += duration + rand() * 0.07
  }
  play({ tones, noise }, { gain: 0.9 })
}

export { isMuted, setMuted, subscribeMuted, unlockAudio }
export type { CueName }

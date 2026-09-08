import type { Cue } from './engine'

/**
 * The sounds HALCYON 4.1 makes. Short, dry, slightly cheap — a machine with one small speaker
 * behind a plastic grille. Nothing here is a modern UI chime.
 */

export const CUES = {
  /** Startup. Two notes, a fifth apart, with the speaker's own thump underneath. */
  boot: {
    tones: [
      { from: 293.66, wave: 'triangle', at: 0, duration: 0.42, gain: 0.34 },
      { from: 440, wave: 'triangle', at: 0.1, duration: 0.5, gain: 0.28 },
      { from: 587.33, wave: 'sine', at: 0.18, duration: 0.62, gain: 0.16 },
    ],
    noise: [{ at: 0, duration: 0.05, gain: 0.1, cutoff: 320 }],
  },

  /** A window coming up: a soft plastic knock. */
  windowOpen: {
    tones: [{ from: 420, to: 560, wave: 'triangle', at: 0, duration: 0.07, gain: 0.16 }],
    noise: [{ at: 0, duration: 0.035, gain: 0.13, cutoff: 2400 }],
  },

  windowClose: {
    tones: [{ from: 520, to: 300, wave: 'triangle', at: 0, duration: 0.08, gain: 0.14 }],
    noise: [{ at: 0, duration: 0.03, gain: 0.1, cutoff: 1600 }],
  },

  /** A mouse button, not a UI sound. */
  click: {
    tones: [],
    noise: [{ at: 0, duration: 0.016, gain: 0.16, cutoff: 3600 }],
  },

  /** Someone is typing at you. The two-tone alert every messenger had. */
  message: {
    tones: [
      { from: 784, wave: 'square', at: 0, duration: 0.075, gain: 0.1 },
      { from: 1046.5, wave: 'square', at: 0.085, duration: 0.1, gain: 0.09 },
    ],
  },

  /** Mail landing in the inbox. Lower and flatter than a chat. */
  mail: {
    tones: [
      { from: 587.33, wave: 'sine', at: 0, duration: 0.11, gain: 0.13 },
      { from: 880, wave: 'sine', at: 0.09, duration: 0.16, gain: 0.1 },
    ],
  },

  /** Pinning evidence: something mechanical closing on paper. */
  pin: {
    tones: [{ from: 240, to: 180, wave: 'square', at: 0, duration: 0.05, gain: 0.1 }],
    noise: [{ at: 0, duration: 0.028, gain: 0.18, cutoff: 1200 }],
  },

  /** The claim holds. A rising fifth, warm, over in a third of a second. */
  claimAccepted: {
    tones: [
      { from: 392, wave: 'triangle', at: 0, duration: 0.16, gain: 0.2 },
      { from: 587.33, wave: 'triangle', at: 0.11, duration: 0.3, gain: 0.18 },
    ],
  },

  /** Filed under your name anyway. A minor second, held slightly too long. */
  claimRefused: {
    tones: [
      { from: 233.08, wave: 'sawtooth', at: 0, duration: 0.34, gain: 0.12 },
      { from: 246.94, wave: 'sawtooth', at: 0.02, duration: 0.34, gain: 0.1 },
    ],
  },

  /**
   * A retrieval. Clean at full coherence; the caller detunes this as memory degrades, so the
   * player hears the cost before they read it.
   */
  recall: {
    tones: [
      { from: 660, to: 880, wave: 'sine', at: 0, duration: 0.28, gain: 0.14 },
      { from: 990, wave: 'sine', at: 0.14, duration: 0.34, gain: 0.07, detune: 6 },
    ],
  },

  /** Terminal refusing you. */
  error: {
    tones: [{ from: 155.56, wave: 'square', at: 0, duration: 0.13, gain: 0.12 }],
  },

  /** Money landing. A till, two floors away. */
  money: {
    tones: [
      { from: 1174.66, wave: 'sine', at: 0, duration: 0.12, gain: 0.16 },
      { from: 1567.98, wave: 'sine', at: 0.07, duration: 0.26, gain: 0.12 },
    ],
    noise: [{ at: 0, duration: 0.02, gain: 0.08, cutoff: 5200 }],
  },

  /** The day ends and the machine stops being yours. Sub, slow, no melody. */
  watched: {
    tones: [
      { from: 58.27, wave: 'sine', at: 0, duration: 2.4, gain: 0.22 },
      { from: 87.31, to: 82, wave: 'sine', at: 0.4, duration: 2, gain: 0.1 },
    ],
    noise: [{ at: 0, duration: 1.6, gain: 0.05, cutoff: 220 }],
  },
} satisfies Record<string, Cue>

export type CueName = keyof typeof CUES

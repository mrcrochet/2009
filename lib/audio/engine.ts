/**
 * A very small Web Audio synth.
 *
 * Everything HALCYON makes a noise about is generated at runtime — no audio files ship, which
 * keeps the bundle honest and happens to be exactly right for the period: these are system
 * beeps out of a 2009 machine, not a sound designer's library.
 *
 * Audio is always optional. Nothing here may throw into gameplay, and nothing plays until the
 * player has interacted with the page (browsers require a gesture before an AudioContext runs).
 */

const MUTE_KEY = 'two009:muted'
const MASTER_GAIN = 0.16

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth'

export interface Tone {
  /** Hz at the start of the tone. */
  readonly from: number
  /** Hz at the end, if it should glide. Defaults to `from`. */
  readonly to?: number
  readonly wave: Waveform
  /** Seconds from the start of the cue. */
  readonly at: number
  readonly duration: number
  /** Peak gain, 0–1, before the master. */
  readonly gain: number
  /** Cents of detune. The Recall cue raises this as memory degrades. */
  readonly detune?: number
}

export interface NoiseBurst {
  readonly at: number
  readonly duration: number
  readonly gain: number
  /** Low-pass cutoff in Hz. Lower is duller, more plastic. */
  readonly cutoff: number
}

export interface Cue {
  readonly tones: readonly Tone[]
  readonly noise?: readonly NoiseBurst[]
}

type Listener = (muted: boolean) => void

let context: AudioContext | null = null
let master: GainNode | null = null
let muted = readMuted()
const listeners = new Set<Listener>()

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (context) return context
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
    master = context.createGain()
    master.gain.value = MASTER_GAIN
    master.connect(context.destination)
    return context
  } catch {
    return null
  }
}

/**
 * Called from the first real user gesture. Before this, `play` is a no-op rather than a console
 * full of autoplay warnings.
 */
export function unlockAudio(): void {
  const ctx = ensureContext()
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {})
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
  try {
    window.localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    /* a private window may refuse; the session still respects the choice */
  }
  for (const listener of listeners) listener(muted)
}

export function subscribeMuted(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** A short burst of filtered white noise — the mechanical half of a click or a thunk. */
function playNoise(ctx: AudioContext, out: GainNode, burst: NoiseBurst, start: number): void {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * burst.duration))
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) {
    // Fade the noise out across the buffer so it reads as a tap, not a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = burst.cutoff

  const gain = ctx.createGain()
  gain.gain.value = burst.gain

  source.connect(filter).connect(gain).connect(out)
  source.start(start + burst.at)
  source.stop(start + burst.at + burst.duration)
}

function playTone(
  ctx: AudioContext,
  out: GainNode,
  tone: Tone,
  start: number,
  detune: number,
): void {
  const osc = ctx.createOscillator()
  osc.type = tone.wave
  osc.detune.value = (tone.detune ?? 0) + detune

  const t0 = start + tone.at
  const t1 = t0 + tone.duration
  osc.frequency.setValueAtTime(tone.from, t0)
  if (tone.to !== undefined && tone.to !== tone.from) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.to), t1)
  }

  // A short attack and an exponential tail. Anything squarer than this clicks.
  const gain = ctx.createGain()
  const attack = Math.min(0.012, tone.duration * 0.25)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, tone.gain), t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t1)

  osc.connect(gain).connect(out)
  osc.start(t0)
  osc.stop(t1 + 0.02)
}

export interface PlayOptions {
  /** Cents of detune applied to every tone — how far out of tune the machine sounds. */
  readonly detune?: number
  /** Scales the whole cue, 0–1. */
  readonly gain?: number
}

export function play(cue: Cue, options: PlayOptions = {}): void {
  if (muted) return
  const ctx = ensureContext()
  if (!ctx || !master) return
  if (ctx.state === 'suspended') return

  try {
    const out = ctx.createGain()
    out.gain.value = options.gain ?? 1
    out.connect(master)

    const start = ctx.currentTime + 0.001
    for (const tone of cue.tones) playTone(ctx, out, tone, start, options.detune ?? 0)
    for (const burst of cue.noise ?? []) playNoise(ctx, out, burst, start)
  } catch {
    /* audio is never allowed to break the game */
  }
}

/** Test seam. */
export function __resetAudioForTests(): void {
  context = null
  master = null
  muted = false
  listeners.clear()
}

import { CUES, type CueName } from './cues'
import { isMuted, play, setMuted, subscribeMuted, unlockAudio, type PlayOptions } from './engine'

export function playCue(name: CueName, options?: PlayOptions): void {
  play(CUES[name], options)
}

/**
 * Recall degrades audibly. At full coherence the retrieval is in tune; by the 24% floor it is
 * nearly a semitone out and noticeably quieter. The player hears the cost before they read it.
 */
export function playRecall(memoryIntegrity: number): void {
  const spent = Math.min(1, Math.max(0, (100 - memoryIntegrity) / 76))
  playCue('recall', { detune: spent * 70, gain: 1 - spent * 0.35 })
}

export { isMuted, setMuted, subscribeMuted, unlockAudio }
export type { CueName }

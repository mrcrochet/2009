import { CUES, type CueName } from './cues'
import { isMuted, play, setMuted, subscribeMuted, unlockAudio, type PlayOptions } from './engine'

export function playCue(name: CueName, options?: PlayOptions): void {
  play(CUES[name], options)
}

export { isMuted, setMuted, subscribeMuted, unlockAudio }
export type { CueName }

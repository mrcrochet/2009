'use client'

import { useEffect } from 'react'
import type { GameEvent, TimelineState } from '@/engine/types'
import { playCue, playRecall, unlockAudio } from '@/lib/audio'

/**
 * Maps game events to sound. Every cue is a consequence of something the player did or something
 * the machine did to them — nothing here decorates a hover.
 */
export function cueForEvent(event: GameEvent, next: TimelineState): (() => void) | null {
  switch (event.type) {
    case 'BOOT_COMPLETED':
      return () => playCue('boot')
    case 'APP_OPENED':
      return () => playCue('windowOpen')
    case 'APP_CLOSED':
      return () => playCue('windowClose')
    case 'CHAT_ADVANCED':
      return () => playCue('message')
    case 'MAIL_UNKNOWN_ARRIVED':
      return () => playCue('mail')
    case 'EVIDENCE_PINNED':
      return () => playCue('pin')
    case 'RECALL_USED':
      return () => playRecall(next.memoryIntegrity)
    case 'CLAIM_ASSERTED':
      return next.lastVerdict?.verdict === 'accepted'
        ? () => playCue('claimAccepted')
        : () => playCue('claimRefused')
    case 'ITEM_SOLD':
      return () => playCue('money')
    case 'TERMINAL_COMMAND_RUN':
      return next.terminal.lines.at(-1)?.tone === 'err' ? () => playCue('error') : null
    case 'DAY_ENDED':
      return () => playCue('watched')
    default:
      return null
  }
}

/**
 * Browsers will not start an AudioContext until the player has interacted with the page, so the
 * first real gesture unlocks it. WAKE UP is that gesture in practice, but a keypress works too.
 */
export function useAudioUnlock(): void {
  useEffect(() => {
    const unlock = () => unlockAudio()
    const options = { once: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, options)
    window.addEventListener('keydown', unlock, options)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
}

export function playEventCue(event: GameEvent, next: TimelineState, prev: TimelineState): void {
  // A window that was already open makes no sound when the dock merely focuses it.
  if (event.type === 'APP_OPENED' && prev.windows.length === next.windows.length) return
  cueForEvent(event, next)?.()
}

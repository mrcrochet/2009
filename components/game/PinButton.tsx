'use client'

import type { EvidenceSourceKind } from '@/engine/types'
import { isPinned } from '@/engine/selectors'
import { useDispatch, useTimeline } from './GameContext'

/**
 * Pinning is the single verb that moves something from the world into the investigation.
 * The pinned state is announced in text, never by colour alone.
 */
export function PinButton({
  evidenceId,
  via,
  size = 'md',
}: {
  evidenceId: string
  via: EvidenceSourceKind
  size?: 'md' | 'sm' | 'row'
}) {
  const dispatch = useDispatch()
  const pinned = useTimeline((s) => isPinned(s, evidenceId))
  const cls = size === 'sm' ? 'hal-pin hal-pin--sm' : size === 'row' ? 'hal-pin hal-pin--row' : 'hal-pin'

  return (
    <button
      type="button"
      className={cls}
      data-evidence={evidenceId}
      data-pinned={pinned}
      disabled={pinned}
      onClick={() => dispatch({ type: 'EVIDENCE_PINNED', evidenceId, via })}
    >
      {pinned ? 'PINNED' : 'PIN AS EVIDENCE'}
    </button>
  )
}

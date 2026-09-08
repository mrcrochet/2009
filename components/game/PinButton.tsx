'use client'

import type { EvidenceSourceKind } from '@/engine/types'
import { isPinned } from '@/engine/selectors'
import { useDispatch, useTimeline } from './GameContext'

/**
 * Pinning is the single verb that moves something from the world into the investigation.
 *
 * The pinned state is announced in text, never by colour alone — and the control stays focusable
 * once used. A real `disabled` here would drop keyboard focus to `<body>` on every pin, which
 * costs a keyboard player their place in the document every time they find something.
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
      aria-disabled={pinned}
      onClick={() => {
        if (pinned) return
        dispatch({ type: 'EVIDENCE_PINNED', evidenceId, via })
      }}
    >
      {pinned ? 'PINNED' : 'PIN AS EVIDENCE'}
    </button>
  )
}

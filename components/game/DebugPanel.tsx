'use client'

import { useState } from 'react'
import { useGame, useTimeline } from './GameContext'

/** Development only. Never rendered in a production game session. */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const replay = useGame((s) => s.replay)
  const state = useTimeline((s) => s)

  if (process.env.NEXT_PUBLIC_DEBUG_PANEL !== '1') return null

  const replayed = open ? replay() : null
  const matches = replayed ? replayed.cashCents === state.cashCents && replayed.minuteOfDay === state.minuteOfDay : null

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        bottom: 8,
        zIndex: 9999,
        font: '10px/1.5 var(--font-mono)',
        color: '#8fa0ac',
        background: 'rgba(8,10,12,.9)',
        border: '1px solid rgba(255,255,255,.14)',
        padding: '6px 8px',
        maxWidth: 280,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}
      >
        debug {open ? '▾' : '▸'}
      </button>
      {open ? (
        <div style={{ marginTop: 6 }}>
          <div>events: {state.eventLog.length}</div>
          <div>minute: {state.minuteOfDay}</div>
          <div>cash: {state.cashCents}c</div>
          <div>shift: {state.temporalShift} · div: {state.divergence} · heat: {state.heat}</div>
          <div>integrity: {state.memoryIntegrity}</div>
          <div>replay: {matches ? 'matches snapshot' : 'DIVERGED'}</div>
        </div>
      ) : null}
    </div>
  )
}

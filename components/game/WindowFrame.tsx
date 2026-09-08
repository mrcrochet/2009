'use client'

import { useCallback, useRef, type ReactNode } from 'react'
import type { AppDefinition, AppId, WindowState } from '@/engine/types'
import { useDispatch } from './GameContext'
import { useDragMove, useIsCompact } from './useDragMove'

interface Props {
  readonly def: AppDefinition
  readonly win: WindowState
  readonly front: boolean
  readonly children: ReactNode
}

export function WindowFrame({ def, win, front, children }: Props) {
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const compact = useIsCompact()

  const origin = useCallback(() => ({ x: win.x, y: win.y }), [win.x, win.y])
  const onCommit = useCallback(
    (x: number, y: number) => dispatch({ type: 'WINDOW_MOVED', app: def.id, x, y }),
    [dispatch, def.id],
  )
  const drag = useDragMove(ref, { origin, onCommit, disabled: compact })

  const focus = useCallback(() => dispatch({ type: 'APP_FOCUSED', app: def.id }), [dispatch, def.id])

  if (win.minimized) return null

  const geometry = win.zoomed
    ? { left: 12, top: 33, width: 'calc(100% - 24px)', height: 'calc(100% - 120px)' }
    : { left: win.x, top: win.y, width: def.width, height: def.height }

  return (
    <div
      ref={ref}
      className={`hal-window${front ? ' hal-window--front' : ''}`}
      style={{ ...geometry, zIndex: win.z }}
      data-app={def.id}
      data-front={front}
      role="dialog"
      aria-label={def.title}
      onPointerDownCapture={focus}
    >
      <div className="hal-window__chrome">
        <div
          className="hal-window__bar"
          onDoubleClick={() => dispatch({ type: 'APP_ZOOM_TOGGLED', app: def.id })}
          {...drag}
        >
          <button
            type="button"
            className="hal-window__light hal-window__light--close"
            aria-label={`Close ${def.title}`}
            onClick={() => dispatch({ type: 'APP_CLOSED', app: def.id })}
          />
          <button
            type="button"
            className="hal-window__light hal-window__light--min"
            aria-label={`Minimise ${def.title}`}
            onClick={() => dispatch({ type: 'APP_MINIMIZED', app: def.id })}
          />
          <span className="hal-window__title">{def.title}</span>
        </div>
        <div className="hal-window__body">{children}</div>
      </div>
    </div>
  )
}

export type { AppId }

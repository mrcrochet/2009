'use client'

import { useEffect, useRef } from 'react'
import { selectChoices } from '@/engine/selectors'
import type { ThreadId } from '@/engine/types'
import { useContent, useDispatch, useTimeline } from '../GameContext'

export function MessengerApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const thread = useTimeline((s) => s.chat.thread)
  const lines = useTimeline((s) => s.chat.log[s.chat.thread])
  const waiting = useTimeline((s) => s.chat.waiting)
  const choices = useTimeline((s) => selectChoices(s, content))
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [lines.length, waiting])

  return (
    <div className="hal-msg">
      <div className="hal-msg__tabs" role="tablist" aria-label="Conversations">
        {content.threads.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="hal-msg__tab"
            aria-selected={thread === t.id}
            onClick={() => {
              dispatch({ type: 'THREAD_SELECTED', thread: t.id as ThreadId })
              dispatch({ type: 'CHAT_STARTED', thread: t.id as ThreadId })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="hal-msg__log" ref={logRef} role="log" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className={`hal-msg__line${line.mine ? ' hal-msg__line--mine' : ''}`}>
            <span className="hal-msg__who">
              {line.who} · {line.time}
            </span>
            <div className="hal-msg__bubble">{line.text}</div>
          </div>
        ))}
      </div>
      <div className="hal-msg__composer">
        {choices.map((text) => (
          <button
            key={text}
            type="button"
            className="hal-msg__choice"
            onClick={() => dispatch({ type: 'CHAT_REPLY_SENT', thread, text })}
          >
            {text}
          </button>
        ))}
        {waiting ? <span className="hal-msg__typing">typing…</span> : null}
      </div>
    </div>
  )
}

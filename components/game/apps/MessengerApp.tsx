'use client'

import { useEffect, useRef } from 'react'
import { selectChoices } from '@/engine/selectors'
import type { ChatLine, ThreadId } from '@/engine/types'
import { useContent, useDispatch, useTimeline } from '../GameContext'
import { useTabList } from '../useTabList'

/** Stable identity, so a thread the day never declared does not remount the log every render. */
const EMPTY_LOG: readonly ChatLine[] = []

export function MessengerApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const thread = useTimeline((s) => s.chat.thread)
  const lines = useTimeline((s) => s.chat.log[s.chat.thread] ?? EMPTY_LOG)
  const waiting = useTimeline((s) => s.chat.waiting[s.chat.thread])
  const choices = useTimeline((s) => selectChoices(s, content))
  const logRef = useRef<HTMLDivElement>(null)

  const threadIds = content.threads.map((t) => t.id as ThreadId)
  const { tabProps, panelProps } = useTabList<ThreadId>(
    threadIds,
    thread,
    (id) => {
      dispatch({ type: 'THREAD_SELECTED', thread: id })
      dispatch({ type: 'CHAT_STARTED', thread: id })
    },
    'ember',
  )

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
            className="hal-msg__tab"
            {...tabProps(t.id as ThreadId)}
            onClick={() => {
              dispatch({ type: 'THREAD_SELECTED', thread: t.id as ThreadId })
              dispatch({ type: 'CHAT_STARTED', thread: t.id as ThreadId })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="hal-msg__panel" {...panelProps}>
        <div className="hal-msg__log" ref={logRef} role="log" aria-live="polite">
          {lines.map((line, i) => (
            <div key={i} className={`hal-msg__line${line.mine ? ' hal-msg__line--mine' : ''}`}>
              <span className="hal-msg__who">
                {line.who} · {line.time}
              </span>
              <div className="hal-msg__bubble">{line.text}</div>
            </div>
          ))}
          {/* Inside the live region, so the pause before a reply is announced too. */}
          {waiting ? <div className="hal-msg__typing">typing…</div> : null}
        </div>
        <div className="hal-msg__composer">
          {choices.map((choice) => (
            <button
              key={choice.text}
              type="button"
              className="hal-msg__choice"
              onClick={() =>
                dispatch({
                  type: 'CHAT_REPLY_SENT',
                  thread,
                  text: choice.text,
                  reply: choice.reply,
                  advances: choice.advances,
                  setsFlag: choice.setsFlag,
                })
              }
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

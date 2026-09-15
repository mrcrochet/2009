'use client'

import { useEffect, useRef } from 'react'
import { useContent, useDispatch, useInvestigation } from '../GameContext'

export function TerminalApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const lines = useInvestigation((s) => s.terminal.lines)
  const input = useInvestigation((s) => s.terminal.input)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [lines.length])

  return (
    <div className="nova-term">
      <div className="nova-term__log" ref={logRef} role="log" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className={`nova-term__line nova-term__line--${line.tone}`}>
            {line.text}
          </div>
        ))}
      </div>
      <div className="nova-term__inputrow">
        <span aria-hidden="true">{content.terminal.prompt}</span>
        <input
          className="nova-term__input"
          aria-label="Terminal command"
          value={input}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => dispatch({ type: 'TERMINAL_INPUT_CHANGED', value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            dispatch({ type: 'TERMINAL_COMMAND_RUN', command: input })
          }}
        />
      </div>
    </div>
  )
}

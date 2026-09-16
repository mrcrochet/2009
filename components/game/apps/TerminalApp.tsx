'use client'

import { useEffect, useRef } from 'react'
import { promptFor } from '@/engine/machine/shell'
import { useContent, useDispatch, useInvestigation } from '../GameContext'

export function TerminalApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const lines = useInvestigation((s) => s.terminal.lines)
  // The prompt carries the working directory, because a shell that never says where it is
  // standing is a shell nobody can be lost in.
  const prompt = useInvestigation((s) => promptFor(content, s.machine.cwd))
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
        <span aria-hidden="true">{prompt}</span>
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

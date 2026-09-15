'use client'

import { useDispatch, useInvestigation } from '../GameContext'

export function NotesApp() {
  const dispatch = useDispatch()
  const notes = useInvestigation((s) => s.notes)

  return (
    <div className="nova-notes">
      <div className="nova-notes__head">UNTITLED — NOT SAVED</div>
      <textarea
        className="nova-notes__area"
        aria-label="Notes"
        value={notes}
        placeholder="Write down what you still remember. It will not stay accurate."
        onChange={(e) => dispatch({ type: 'NOTES_CHANGED', value: e.target.value })}
      />
    </div>
  )
}

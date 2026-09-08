'use client'

import { useDispatch, useTimeline } from '../GameContext'

export function NotesApp() {
  const dispatch = useDispatch()
  const notes = useTimeline((s) => s.notes)

  return (
    <div className="hal-notes">
      <div className="hal-notes__head">UNTITLED — NOT SAVED</div>
      <textarea
        className="hal-notes__area"
        aria-label="Notes"
        value={notes}
        placeholder="Write down what you still remember. It will not stay accurate."
        onChange={(e) => dispatch({ type: 'NOTES_CHANGED', value: e.target.value })}
      />
    </div>
  )
}

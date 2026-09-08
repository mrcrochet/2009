'use client'

import { selectMail, selectOpenMail } from '@/engine/selectors'
import { useContent, useDispatch, useTimeline } from '../GameContext'
import { PinButton } from '../PinButton'

export function MailApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const list = useTimeline((s) => selectMail(s, content))
  const open = useTimeline((s) => selectOpenMail(s, content))

  return (
    <>
      <div className="hal-mail__list" role="list" aria-label="Inbox">
        <div className="hal-mail__listhead">INBOX — CORVID MAIL</div>
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            role="listitem"
            className={`hal-mail__row${m.unread ? ' hal-mail__row--unread' : ''}`}
            aria-current={m.selected}
            onClick={() => dispatch({ type: 'MAIL_OPENED', mailId: m.id })}
          >
            <span className="hal-mail__rowtop">
              <span className="hal-mail__from">{m.from}</span>
              <span className="hal-mail__time">{m.time}</span>
            </span>
            <span className="hal-mail__subj">{m.subject}</span>
          </button>
        ))}
      </div>
      <div className="hal-mail__read">
        {open ? (
          <>
            <div className="hal-mail__readsubj">{open.subject}</div>
            <div className="hal-mail__meta">{open.meta}</div>
            {open.body.map((paragraph, i) => (
              <p key={i} className="hal-mail__p">
                {paragraph}
              </p>
            ))}
            {open.evidenceId ? <PinButton evidenceId={open.evidenceId} via="mail" /> : null}
          </>
        ) : null}
      </div>
    </>
  )
}

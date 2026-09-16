'use client'

import { selectMail, selectOpenMail } from '@/engine/selectors'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { PinButton } from '../PinButton'

export function MailApp() {
  const content = useContent()
  // What this case calls its mail client. The build used to print a brand of its own over every
  // case's inbox — one belonging to a product that no longer exists.
  const client = content.apps.find((a) => a.id === 'mail')?.title ?? 'Mail'
  const dispatch = useDispatch()
  const list = useInvestigation((s) => selectMail(s, content))
  const open = useInvestigation((s) => selectOpenMail(s, content))

  return (
    <>
      <div className="nova-mail__list" role="listbox" aria-label="Inbox">
        <div className="nova-mail__listhead">INBOX — {client.toUpperCase()}</div>
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            role="option"
            className={`nova-mail__row${m.unread ? ' nova-mail__row--unread' : ''}`}
            aria-selected={m.selected}
            onClick={() => dispatch({ type: 'MAIL_OPENED', mailId: m.id })}
          >
            <span className="nova-mail__rowtop">
              <span className="nova-mail__from">{m.from}</span>
              <span className="nova-mail__time">{m.time}</span>
            </span>
            <span className="nova-mail__subj">{m.subject}</span>
          </button>
        ))}
      </div>
      <div className="nova-mail__read">
        {open ? (
          <>
            <div className="nova-mail__readsubj">{open.subject}</div>
            <div className="nova-mail__meta">{open.meta}</div>
            {open.body.map((paragraph, i) => (
              <p key={i} className="nova-mail__p">
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

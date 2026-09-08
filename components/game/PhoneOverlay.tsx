'use client'

import { useCallback, useRef } from 'react'
import { clockString } from '@/engine/clock'
import type { PhoneTab } from '@/engine/types'
import { defaultPhonePosition } from '@/engine/rules'
import { useContent, useDispatch, useGame, useTimeline } from './GameContext'
import { PhotoFrame } from './PhotoFrame'
import { PinButton } from './PinButton'
import { useDragMove, useIsCompact } from './useDragMove'

const TABS: readonly { id: PhoneTab; label: string }[] = [
  { id: 'sms', label: 'SMS' },
  { id: 'photos', label: 'Photos' },
  { id: 'contacts', label: 'Contacts' },
]

/** An object on the desk, not a tab in a dashboard. It moves, and it can be put down. */
export function PhoneOverlay() {
  const content = useContent()
  const dispatch = useDispatch()
  const viewport = useGame((s) => s.viewport)
  const phone = useTimeline((s) => s.phone)
  const clock = useTimeline((s) => clockString(s.minuteOfDay))
  const ref = useRef<HTMLDivElement>(null)
  const compact = useIsCompact()

  const fallback = defaultPhonePosition(viewport)
  const x = phone.x ?? fallback.x
  const y = phone.y ?? fallback.y

  const origin = useCallback(() => ({ x, y }), [x, y])
  const onCommit = useCallback((nx: number, ny: number) => dispatch({ type: 'PHONE_MOVED', x: nx, y: ny }), [dispatch])
  const drag = useDragMove(ref, { origin, onCommit, disabled: compact })

  if (!phone.open) return null

  return (
    <div ref={ref} className="hal-phone" style={{ left: x, top: y }} data-testid="phone-overlay">
      <div className="hal-phone__body" {...drag}>
        <div className="hal-phone__device">{content.phone.device}</div>
        <div className="hal-phone__screen">
          <div className="hal-phone__status">
            <span>{content.phone.carrier}</span>
            <span>{clock}</span>
          </div>
          <div className="hal-phone__tabs" role="tablist" aria-label="Phone">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className="hal-phone__tab"
                aria-selected={phone.tab === t.id}
                onClick={() => dispatch({ type: 'PHONE_TAB_CHANGED', tab: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="hal-phone__view">
            {phone.tab === 'sms' ? <Sms /> : null}
            {phone.tab === 'photos' ? <Photos /> : null}
            {phone.tab === 'contacts' ? <Contacts /> : null}
          </div>
        </div>
        <div className="hal-phone__foot">
          <button
            type="button"
            className="hal-phone__home"
            aria-label="Put the phone down"
            onClick={() => dispatch({ type: 'PHONE_TOGGLED' })}
          />
        </div>
      </div>
    </div>
  )
}

function Sms() {
  const content = useContent()
  const dispatch = useDispatch()
  const step = useTimeline((s) => s.phone.smsStep)
  const shown = content.phone.sms.slice(0, step + 1)
  const node = content.phone.sms[step]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {shown.map((m, i) => (
        <div key={i} className="hal-phone__sms">
          <div className="hal-phone__smswho">
            {m.who} · {m.time}
          </div>
          <div className="hal-phone__smsbubble">{m.text}</div>
          {m.evidenceId ? (
            <div style={{ paddingTop: 6 }}>
              <PinButton evidenceId={m.evidenceId} via="phone" size="sm" />
            </div>
          ) : null}
        </div>
      ))}
      {node && node.choices.length > 0 ? (
        <div className="hal-phone__smsactions">
          {node.choices.map((c) => (
            <button
              key={c}
              type="button"
              className="hal-phone__choice"
              onClick={() => dispatch({ type: 'SMS_ADVANCED' })}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Photos() {
  const content = useContent()
  return (
    <div className="hal-phone__photos">
      {content.phone.photos.map((p) => (
        <div key={p.id} className="hal-phone__photo">
          <div className="hal-phone__thumb">
            <PhotoFrame subject={p.subject} label={p.label} />
            <span className="hal-phone__stamp">{p.label}</span>
          </div>
          <div className="hal-phone__photometa">{p.meta}</div>
          {p.evidenceId ? (
            <div className="hal-phone__photopin">
              <PinButton evidenceId={p.evidenceId} via="phone" size="sm" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Contacts() {
  const content = useContent()
  return (
    <div className="hal-phone__contacts">
      {content.phone.contacts.map((c) => (
        <div key={c.name} className="hal-phone__contact">
          <span>{c.name}</span>
          <span>{c.number}</span>
        </div>
      ))}
    </div>
  )
}

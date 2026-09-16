'use client'

import { useCallback, useRef } from 'react'
import { clockString } from '@/engine/clock'
import { selectPhonePhotos } from '@/engine/selectors'
import type { PhoneTab } from '@/engine/types'
import { defaultPhonePosition, phoneDeviceId } from '@/engine/rules'
import { useContent, useDispatch, useGame, useInvestigation } from './GameContext'
import { PhotoFrame } from './PhotoFrame'
import { PinButton } from './PinButton'
import { useDragMove, useIsCompact } from './useDragMove'
import { useTabList } from './useTabList'

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
  const phone = useInvestigation((s) => s.phone)
  const clock = useInvestigation((s) => clockString(s.minute))
  /*
   * A handset on the desk that nobody has opened is a lock screen.
   *
   * It used to be the whole phone: the tabs were there, the thread was there, and the passcode
   * the case goes to some trouble to hide was decoration. The rule that a locked source yields
   * nothing has to hold on the object itself, not only in the workstation's viewer.
   */
  const locked = useInvestigation((s) => {
    const id = phoneDeviceId(content)
    return id ? !s.devices[id]?.unlocked : false
  })
  const ref = useRef<HTMLDivElement>(null)
  const compact = useIsCompact()

  const fallback = defaultPhonePosition(viewport)
  const x = phone.x ?? fallback.x
  const y = phone.y ?? fallback.y

  const { tabProps, panelProps } = useTabList<PhoneTab>(
    TABS.map((t) => t.id),
    phone.tab,
    (tab) => dispatch({ type: 'PHONE_TAB_CHANGED', tab }),
    'phone',
  )

  const origin = useCallback(() => ({ x, y }), [x, y])
  const onCommit = useCallback(
    (nx: number, ny: number) => dispatch({ type: 'PHONE_MOVED', x: nx, y: ny }),
    [dispatch],
  )
  const drag = useDragMove(ref, { origin, onCommit, disabled: compact })

  // A case may supply no phone at all, and one it does supply may still be locked.
  const device = content.phone
  if (!device || !phone.open) return null

  return (
    <div ref={ref} className="nova-phone" style={{ left: x, top: y }} data-testid="phone-overlay">
      <div className="nova-phone__body" {...drag}>
        <div className="nova-phone__device">{device.device}</div>
        <div className="nova-phone__screen">
          <div className="nova-phone__status">
            <span>{device.carrier}</span>
            <span>{clock}</span>
          </div>
          {locked ? (
            <Locked onOpenDevices={() => dispatch({ type: 'APP_OPENED', app: 'devices' })} />
          ) : (
            <>
              <div className="nova-phone__tabs" role="tablist" aria-label="Phone">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="nova-phone__tab"
                    {...tabProps(t.id)}
                    onClick={() => dispatch({ type: 'PHONE_TAB_CHANGED', tab: t.id })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="nova-phone__view" {...panelProps}>
                {phone.tab === 'sms' ? <Sms /> : null}
                {phone.tab === 'photos' ? <Photos /> : null}
                {phone.tab === 'contacts' ? <Contacts /> : null}
              </div>
            </>
          )}
        </div>
        <div className="nova-phone__foot">
          <button
            type="button"
            className="nova-phone__home"
            aria-label="Put the phone down"
            onClick={() => dispatch({ type: 'PHONE_TOGGLED' })}
          />
        </div>
      </div>
    </div>
  )
}

/** The screen a locked handset actually shows. The verb lives in Devices; this points at it. */
function Locked({ onOpenDevices }: { onOpenDevices: () => void }) {
  return (
    <div className="nova-phone__locked">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path
          d="M7.6 10.4V7.6a4.4 4.4 0 0 1 8.8 0v2.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="5.4"
          y="10.4"
          width="13.2"
          height="9.6"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
      <p className="nova-phone__lockedline">Locked</p>
      <p className="nova-phone__lockedhint">
        This handset has not been opened. Nothing on it has been extracted.
      </p>
      <button type="button" className="nova-phone__lockedcta" onClick={onOpenDevices}>
        OPEN IT IN DEVICES
      </button>
    </div>
  )
}

function Sms() {
  const content = useContent()
  const dispatch = useDispatch()
  const step = useInvestigation((s) => s.phone.smsStep)
  const sms = content.phone?.sms ?? []
  const shown = sms.slice(0, step + 1)
  const node = sms[step]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {shown.map((m, i) => (
        <div key={i} className="nova-phone__sms">
          <div className="nova-phone__smswho">
            {m.who} · {m.time}
          </div>
          <div className="nova-phone__smsbubble">{m.text}</div>
          {m.evidenceId ? (
            <div style={{ paddingTop: 6 }}>
              <PinButton evidenceId={m.evidenceId} via="phone" size="sm" />
            </div>
          ) : null}
        </div>
      ))}
      {node && node.choices.length > 0 ? (
        <div className="nova-phone__smsactions">
          {node.choices.map((c) => (
            <button
              key={c}
              type="button"
              className="nova-phone__choice"
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

/**
 * The roll, as the handset shows it: a picture and the one line under it.
 *
 * The same three files are in the workstation's viewer with the extraction notes attached. This
 * is the phone's version, and a phone does not tell you the ISO.
 */
function Photos() {
  const content = useContent()
  const photos = useInvestigation((s) => selectPhonePhotos(s, content))
  return (
    <div className="nova-phone__photos">
      {photos.map((p) => (
        <div key={p.id} className="nova-phone__photo">
          <div className="nova-phone__thumb">
            <PhotoFrame subject={p.subject} label={p.label} />
            <span className="nova-phone__stamp">{p.label}</span>
          </div>
          <div className="nova-phone__photometa">{p.meta}</div>
          {p.evidenceId ? (
            <div className="nova-phone__photopin">
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
    <div className="nova-phone__contacts">
      {(content.phone?.contacts ?? []).map((c) => (
        <div key={c.name} className="nova-phone__contact">
          <span>{c.name}</span>
          <span>{c.number}</span>
        </div>
      ))}
    </div>
  )
}

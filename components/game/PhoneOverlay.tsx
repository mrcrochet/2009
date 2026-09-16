'use client'

import { useCallback, useRef, useState } from 'react'
import { defaultPhonePosition, phoneDeviceId } from '@/engine/rules'
import { selectPhonePhotos } from '@/engine/selectors'
import type { MobileApp } from '@/engine/case-schema'
import { PhotoFrame } from './PhotoFrame'
import { PinButton } from './PinButton'
import { useContent, useDispatch, useGame, useInvestigation } from './GameContext'
import { useDragMove, useIsCompact } from './useDragMove'

/**
 * NOVA Mobile — the handset, as a device rather than as a panel with tabs.
 *
 * It had three tabs. A phone is not three tabs: it is a thing you unlock, a home screen you come
 * back to, applications you go into and out of, and notifications that are gone once you have
 * read them. Every one of those is cheap, and every one of them is a moment where a player
 * either believes they are holding an object or does not.
 *
 * The rule the whole thing is built on: **it should behave the way a phone behaves**, not look
 * impressive. A call has a duration. A photograph has metadata. A network remembers when it was
 * last joined. The battery keeps draining after the handset stopped syncing, which is the sort
 * of thing nobody thinks to wipe and the reason this surface is worth building at all.
 *
 * What it is *not* is a second copy of the device. The passcode entered here opens the same
 * device the workstation's Devices application opens, because it is the same device.
 */
export function PhoneOverlay() {
  const content = useContent()
  const dispatch = useDispatch()
  const viewport = useGame((s) => s.viewport)
  const phone = useInvestigation((s) => s.phone)
  const ref = useRef<HTMLDivElement>(null)
  const compact = useIsCompact()

  const deviceId = phoneDeviceId(content)
  const unlocked = useInvestigation((s) => (deviceId ? Boolean(s.devices[deviceId]?.unlocked) : true))

  const fallback = defaultPhonePosition(viewport)
  const x = phone.x ?? fallback.x
  const y = phone.y ?? fallback.y

  const origin = useCallback(() => ({ x, y }), [x, y])
  const onCommit = useCallback(
    (nx: number, ny: number) => dispatch({ type: 'PHONE_MOVED', x: nx, y: ny }),
    [dispatch],
  )
  const drag = useDragMove(ref, { origin, onCommit, disabled: compact })

  // A case may supply no phone at all.
  const cfg = content.phone
  if (!cfg || !phone.open) return null

  const here = phone.route.at(-1) ?? null

  return (
    <div ref={ref} className="nova-phone" style={{ left: x, top: y }} data-testid="phone-overlay">
      <div className="nova-phone__body" {...drag}>
        <div className="nova-phone__device">{cfg.device}</div>
        <div className="nova-phone__screen">
          <div className="nova-phone__status">
            {/*
              The carrier, locked or not. The night this handset lost service is a fact the case
              carries three other ways — a notification, the call log, the battery curve — and a
              status bar that announces it permanently hands over the finding before the player
              has gone looking for anything.
            */}
            <span>{cfg.carrier}</span>
            <span>{cfg.lockTime}</span>
            <span className="nova-phone__battery" aria-label={`Battery ${cfg.battery} per cent`}>
              <span className="nova-phone__cell">
                <i style={{ width: `${cfg.battery}%` }} />
              </span>
              {cfg.battery}
            </span>
          </div>

          {unlocked ? (
            <>
              <div className="nova-phone__view">
                {here === null ? <Home /> : <MobileApp app={here.app} item={here.item} />}
              </div>
              <NavBar depth={phone.route.length} />
            </>
          ) : (
            <LockScreen deviceId={deviceId} />
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

/* ------------------------------------------------------------- lock screen */

/**
 * The lock screen, with the notifications that were on it and a keypad that actually opens it.
 *
 * The passcode used to be enterable only in the workstation's Devices application, which meant
 * the object on the desk was a picture and the tool beside it was the device. Both work now, and
 * both go through the same reducer rule.
 */
function LockScreen({ deviceId }: { deviceId: string | null }) {
  const content = useContent()
  const dispatch = useDispatch()
  const attempts = useInvestigation((s) => s.phone.passcodeAttempts)
  const [entered, setEntered] = useState('')
  const cfg = content.phone!
  const length = 6

  const press = (digit: string) => {
    if (!deviceId) return
    const next = `${entered}${digit}`.slice(0, length)
    setEntered(next)
    if (next.length === length) {
      dispatch({ type: 'PHONE_PASSCODE_ATTEMPTED', deviceId, key: next })
      setEntered('')
    }
  }

  return (
    <div className="nova-lock">
      <div className="nova-lock__clock">
        <div className="nova-lock__time">{cfg.lockTime}</div>
        <div className="nova-lock__date">{cfg.lockDate}</div>
      </div>

      <div className="nova-lock__alerts">
        {content.phone?.notifications.slice(0, 3).map((alert) => (
          <div key={alert.id} className="nova-lock__alert">
            <span className="nova-lock__alerthead">
              {alert.title}
              <span>{alert.time}</span>
            </span>
            <span className="nova-lock__alertbody">{alert.body}</span>
          </div>
        ))}
      </div>

      <div className="nova-lock__pad">
        <div className="nova-lock__label">Enter Passcode</div>
        <div className="nova-lock__dots" role="status" aria-label={`${entered.length} of ${length} digits`}>
          {Array.from({ length }, (_, i) => (
            <i key={i} data-filled={i < entered.length} />
          ))}
        </div>
        {attempts > 0 ? (
          <div className="nova-lock__wrong" role="status">
            {cfg.wrongPasscode}
          </div>
        ) : null}
        <div className="nova-lock__keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" className="nova-lock__blank" disabled aria-hidden="true" />
          <button type="button" onClick={() => press('0')}>
            0
          </button>
          <button
            type="button"
            className="nova-lock__del"
            aria-label="Delete"
            onClick={() => setEntered((e) => e.slice(0, -1))}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- shell */

function NavBar({ depth }: { depth: number }) {
  const dispatch = useDispatch()
  return (
    <div className="nova-phone__nav">
      {/* aria-disabled, not disabled: pressing Back on the last screen is how a player finds
          out they are on the home screen, and a control that disables itself under the finger
          drops focus to the body. */}
      <button
        type="button"
        aria-label="Back"
        aria-disabled={depth === 0}
        onClick={() => depth > 0 && dispatch({ type: 'MOBILE_BACK' })}
      >
        ‹
      </button>
      <button
        type="button"
        className="nova-phone__navhome"
        aria-label="Home screen"
        onClick={() => dispatch({ type: 'MOBILE_HOME' })}
      />
      <span />
    </div>
  )
}

function Home() {
  const content = useContent()
  const dispatch = useDispatch()
  const read = useInvestigation((s) => s.phone.readNotifications)
  const cfg = content.phone!
  const pending = cfg.notifications.filter((n) => !read.includes(n.id))

  return (
    <div className="nova-home">
      {pending.length > 0 ? (
        <div className="nova-home__alerts">
          {pending.map((alert) => (
            <button
              key={alert.id}
              type="button"
              className="nova-home__alert"
              onClick={() =>
                dispatch({
                  type: 'MOBILE_NOTIFICATION_OPENED',
                  notificationId: alert.id,
                  app: alert.app,
                  item: alert.item,
                })
              }
            >
              <span className="nova-home__alerthead">
                {alert.title}
                <span>{alert.time}</span>
              </span>
              <span className="nova-home__alertbody">{alert.body}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="nova-home__grid">
        {cfg.apps.map((app) => (
          <button
            key={app.id}
            type="button"
            className="nova-home__app"
            data-mobile-app={app.id}
            onClick={() => dispatch({ type: 'MOBILE_OPENED', app: app.id })}
          >
            <span className="nova-home__icon">
              <AppGlyph glyph={app.glyph} />
              {app.badge > 0 ? <span className="nova-home__badge">{app.badge}</span> : null}
            </span>
            <span className="nova-home__name">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Hand-drawn, like every other icon in this product. Never emoji, never an icon library. */
function AppGlyph({ glyph }: { glyph: MobileApp['glyph'] }) {
  const paths: Record<string, React.ReactNode> = {
    messages: <path d="M3 5.5h14v8.5h-7l-4 3v-3H3z" />,
    calls: <path d="M5 3.5c0 7 4.5 11.5 11.5 11.5v-3l-3.5-1.5-2 2a11 11 0 0 1-3.5-3.5l2-2L8 3.5z" />,
    contacts: (
      <>
        <circle cx="10" cy="7.5" r="3" />
        <path d="M4.5 16.5c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5" />
      </>
    ),
    photos: (
      <>
        <rect x="3" y="4" width="14" height="12" rx="1.5" />
        <path d="M3 13l4-4 3 3 3-3.5 4 4.5" />
      </>
    ),
    maps: <path d="M4 5l4-1.5 4 1.5 4-1.5v12L12 17l-4-1.5L4 17z" />,
    browser: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="M3.5 10h13M10 3.5c2.4 2.6 2.4 10.4 0 13M10 3.5c-2.4 2.6-2.4 10.4 0 13" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="14" height="10" rx="1.4" />
        <path d="M3.3 5.6l6.7 4.6 6.7-4.6" />
      </>
    ),
    notes: (
      <>
        <rect x="4.5" y="3" width="11" height="14" rx="1.4" />
        <path d="M7 7h6M7 10h6M7 13h3.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 2.5v2.2M10 15.3v2.2M17.5 10h-2.2M4.7 10H2.5M15.3 4.7l-1.6 1.6M6.3 13.7l-1.6 1.6M15.3 15.3l-1.6-1.6M6.3 6.3L4.7 4.7" />
      </>
    ),
    app: <rect x="4" y="4" width="12" height="12" rx="2.5" />,
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[glyph] ?? paths.app}
    </svg>
  )
}

/* ------------------------------------------------------------------- apps */

function MobileApp({ app, item }: { app: string; item: string | null }) {
  switch (app) {
    case 'messages':
      return <Messages />
    case 'calls':
      return <Calls item={item} />
    case 'contacts':
      return <Contacts />
    case 'photos':
      return <Photos item={item} />
    case 'settings':
      return <Settings />
    default:
      // A case may name an application this build does not have. It says so rather than crashing.
      return <div className="nova-mobile__empty">This handset does not have that application.</div>
  }
}

function Messages() {
  const content = useContent()
  const dispatch = useDispatch()
  const step = useInvestigation((s) => s.phone.smsStep)
  const sms = content.phone?.sms ?? []
  const shown = sms.slice(0, step + 1)
  const node = sms[step]

  return (
    <div className="nova-mobile">
      <div className="nova-mobile__title">Messages</div>
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

/** Recents, and one call's detail. Metadata is what a call actually leaves behind. */
function Calls({ item }: { item: string | null }) {
  const content = useContent()
  const dispatch = useDispatch()
  const cfg = content.phone!
  /*
   * Subscribed to the grants themselves, not to a closure over the state.
   *
   * Returning a function from the selector hands the store a new reference on every render,
   * which through `useSyncExternalStore` is not a slow render but an infinite one.
   */
  const granted = useInvestigation((s) => s.services)
  const open = item ? cfg.calls.find((c) => c.id === item) : null

  if (open) {
    const gate = content.services.find((svc) => svc.grantsEvidenceIds.includes(open.evidenceId ?? ''))
    const pinnable =
      open.evidenceId && (!gate || granted.includes(gate.id)) ? open.evidenceId : null
    return (
      <div className="nova-mobile">
        <div className="nova-mobile__title">{open.who}</div>
        <div className="nova-mobile__big">{open.number}</div>
        <dl className="nova-mobile__facts">
          <div>
            <dt>Direction</dt>
            <dd>{DIRECTION[open.direction]}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{open.when}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{open.duration === 0 ? 'no answer' : formatDuration(open.duration)}</dd>
          </div>
        </dl>
        {pinnable ? (
          <div style={{ paddingTop: 10 }}>
            <PinButton evidenceId={pinnable} via="phone" size="sm" />
          </div>
        ) : null}
      </div>
    )
  }

  const latestDay = calendarDay(cfg.calls[0]?.when ?? '')

  return (
    <div className="nova-mobile">
      <div className="nova-mobile__title">Recents</div>
      <div className="nova-mobile__rows">
        {cfg.calls.map((call) => (
          <button
            key={call.id}
            type="button"
            className="nova-mobile__row"
            data-call={call.id}
            onClick={() => dispatch({ type: 'MOBILE_OPENED', app: 'calls', item: call.id })}
          >
            <span className="nova-mobile__rowtop">
              <span data-missed={call.direction === 'missed'}>{call.who}</span>
              <span className="nova-mobile__rowwhen">{recentsWhen(call.when, latestDay)}</span>
            </span>
            <span className="nova-mobile__rowsub">
              {DIRECTION[call.direction]}
              {call.duration > 0 ? ` · ${formatDuration(call.duration)}` : ''}
            </span>
          </button>
        ))}
      </div>
      {cfg.callsNote ? <p className="nova-mobile__note">{cfg.callsNote}</p> : null}
    </div>
  )
}

const DIRECTION: Record<string, string> = { in: 'Incoming', out: 'Outgoing', missed: 'Missed' }

/** "09 Jun 22:51" -> "09 Jun". The day an entry belongs to. */
function calendarDay(when: string): string {
  return when.split(' ').slice(0, 2).join(' ')
}

/**
 * What a recents list puts on the right.
 *
 * The time for a call from the most recent day the handset saw, the date for anything older —
 * which is what every phone does, and what makes "07 Jun" read as a different night rather than
 * as another row.
 */
function recentsWhen(when: string, latestDay: string): string {
  const day = calendarDay(when)
  return day === latestDay ? (when.split(' ')[2] ?? when) : day
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function Contacts() {
  const content = useContent()
  return (
    <div className="nova-mobile">
      <div className="nova-mobile__title">Contacts</div>
      <div className="nova-phone__contacts">
        {(content.phone?.contacts ?? []).map((c) => (
          <div key={c.name} className="nova-phone__contact">
            <span>{c.name}</span>
            <span>{c.number}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A grid, and one frame with what the camera wrote. Not a vertical list. */
function Photos({ item }: { item: string | null }) {
  const content = useContent()
  const dispatch = useDispatch()
  const photos = useInvestigation((s) => selectPhonePhotos(s, content))
  const open = item ? photos.find((p) => p.id === item) : null

  if (open) {
    return (
      <div className="nova-mobile">
        <div className="nova-phone__full">
          <PhotoFrame subject={open.subject} label={open.label} />
        </div>
        <div className="nova-mobile__title">{open.label}</div>
        <div className="nova-phone__photometa">{open.meta}</div>
        {open.evidenceId ? (
          <div className="nova-phone__photopin">
            <PinButton evidenceId={open.evidenceId} via="phone" size="sm" />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="nova-mobile">
      <div className="nova-mobile__title">Photos</div>
      <div className="nova-phone__roll">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            className="nova-phone__tile"
            data-photo={p.id}
            aria-label={p.label}
            onClick={() => dispatch({ type: 'MOBILE_OPENED', app: 'photos', item: p.id })}
          >
            <PhotoFrame subject={p.subject} label={p.label} />
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Settings, which on a real handset is where the evidence actually is.
 *
 * The battery is a clock nobody thinks to wipe, and the list of remembered networks says where
 * the device physically was. Neither is presented as a finding — they are just what the phone
 * knows about itself, which is the point.
 */
function Settings() {
  const content = useContent()
  const cfg = content.phone!
  const peak = Math.max(1, ...cfg.batteryHistory.map((p) => p.level))

  return (
    <div className="nova-mobile">
      <div className="nova-mobile__title">Settings</div>

      <div className="nova-mobile__section">About</div>
      <dl className="nova-mobile__facts">
        <div>
          <dt>Model</dt>
          <dd>{cfg.device}</dd>
        </div>
        <div>
          <dt>Software</dt>
          <dd>{cfg.os}</dd>
        </div>
        <div>
          <dt>Carrier</dt>
          <dd>{cfg.carrier}</dd>
        </div>
      </dl>

      {cfg.batteryHistory.length > 0 ? (
        <>
          <div className="nova-mobile__section">Battery</div>
          <div className="nova-mobile__bars">
            {cfg.batteryHistory.map((point) => (
              <div key={point.hour} className="nova-mobile__bar">
                <span className="nova-mobile__barhour">{point.hour}</span>
                <span className="nova-mobile__bartrack">
                  <i style={{ width: `${(point.level / peak) * 100}%` }} />
                </span>
                <span className="nova-mobile__barlevel">{point.level}%</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {cfg.networks.length > 0 ? (
        <>
          <div className="nova-mobile__section">Wi-Fi · known networks</div>
          <div className="nova-mobile__rows">
            {cfg.networks.map((net) => (
              <div key={net.ssid} className="nova-mobile__row" data-network={net.ssid}>
                <span className="nova-mobile__rowtop">
                  <span>{net.ssid}</span>
                </span>
                <span className="nova-mobile__rowsub">Last joined {net.lastJoined}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

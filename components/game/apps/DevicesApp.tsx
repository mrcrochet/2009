'use client'

import { useState } from 'react'
import { selectDevices, selectServices } from '@/engine/selectors'
import { useContent, useDispatch, useInvestigation } from '../GameContext'

/**
 * The sources on the desk.
 *
 * This is the application the pivot exists for. The workstation is the machine; a phone, a disk
 * image or a drive is something attached to it, and a case may attach two, one, or none. A
 * locked handset sitting here saying it is locked is a fact about the case rather than a missing
 * feature — it is the reason to go and find what opens it.
 */
export function DevicesApp() {
  const content = useContent()
  const devices = useInvestigation((s) => selectDevices(s, content))
  const services = useInvestigation((s) => selectServices(s, content))

  return (
    <div className="hal-devices">
      <div className="hal-devices__list">
        {devices.map((device) => (
          <DeviceRow key={device.id} id={device.id} />
        ))}
        {devices.length === 0 ? (
          <p className="hal-devices__empty">
            No sources are attached to this case. Everything you find, you find outside it.
          </p>
        ) : null}
      </div>
      {services.length > 0 ? (
        <div className="hal-devices__services">
          {services.map((service) => (
            <div key={service.id} className="hal-devices__service" data-service={service.id}>
              <div className="hal-devices__servicetitle">{service.title}</div>
              {service.granted ? (
                <p className="hal-devices__servicedone">{service.completed}</p>
              ) : (
                <>
                  <p className="hal-devices__serviceline">{service.unavailable}</p>
                  <p className="hal-devices__serviceline">{service.offer}</p>
                  {/*
                    The price is not here, and the button does not take money. Recovery is bought
                    on the account page, where a purchase looks like a purchase — a card field
                    inside a simulated computer is the one place this product could mislead
                    somebody without meaning to.
                  */}
                  <p className="hal-devices__servicereal">{service.realityNote}</p>
                  <a className="hal-cta hal-cta--ghost" href={`/account?service=${service.id}`}>
                    View recovery options
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DeviceRow({ id }: { id: string }) {
  const content = useContent()
  const dispatch = useDispatch()
  const device = useInvestigation((s) => selectDevices(s, content).find((d) => d.id === id))
  const [key, setKey] = useState('')
  const [refused, setRefused] = useState(false)
  const authored = content.devices.find((d) => d.id === id)

  if (!device || !authored) return null

  const submit = () => {
    dispatch({ type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: id, key })
    // The reducer is the authority. If it refused, the device is still shut.
    setRefused(true)
    setKey('')
  }

  return (
    <div className="hal-device" data-device={id} data-unlocked={device.unlocked}>
      <div className="hal-device__head">
        <span className="hal-device__label">{device.label}</span>
        <span className="hal-device__state">
          {!device.connected ? 'NOT HANDED OVER' : device.unlocked ? 'OPEN' : 'LOCKED'}
        </span>
      </div>
      <div className="hal-device__meta">
        {device.owner} · {device.meta}
      </div>
      {device.connected && !device.unlocked ? (
        <div className="hal-device__lock">
          {device.unlockHint ? <p className="hal-device__hint">{device.unlockHint}</p> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <label className="hal-device__field">
              <span className="hal-device__fieldlabel">Passcode</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={key}
                onChange={(event) => {
                  setKey(event.target.value)
                  setRefused(false)
                }}
              />
            </label>
            <button type="submit" className="hal-cta" disabled={key.trim().length === 0}>
              OPEN
            </button>
          </form>
          {refused && authored.wrongKey ? (
            <p className="hal-device__refused" role="status">
              {authored.wrongKey}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

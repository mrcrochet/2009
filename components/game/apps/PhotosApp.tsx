'use client'

import { useRef, type KeyboardEvent } from 'react'
import { selectOpenPhoto, selectPhotos } from '@/engine/selectors'
import { PhotoFrame } from '../PhotoFrame'
import { PinButton } from '../PinButton'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { useQuickLookKey } from '../useQuickLook'

/** The contact sheet is two frames wide, so the arrow keys know what up and down mean. */
const COLUMNS = 2

/**
 * The workstation's viewer over everything this machine has pulled off a source.
 *
 * It is not the handset's camera roll with a desktop border round it. The phone shows what a
 * phone shows — a picture and the line under it; this shows what an extraction found: where the
 * file came from, when the sensor says it was taken, and, in the one frame that matters, that
 * there is no location block on it and never was. A photograph off a source nobody has unlocked
 * is not here at all, because it is not on this machine.
 */
export function PhotosApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const photos = useInvestigation((s) => selectPhotos(s, content))
  const open = useInvestigation((s) => selectOpenPhoto(s, content))
  const quickLook = useQuickLookKey()
  const sheetRef = useRef<HTMLDivElement>(null)

  if (photos.length === 0) {
    return (
      <div className="nova-photos__empty">
        Nothing has been extracted from a source on this workstation yet.
      </div>
    )
  }

  const index = photos.findIndex((p) => p.id === open?.id)

  function move(to: number) {
    const target = photos[Math.min(photos.length - 1, Math.max(0, to))]
    if (!target) return
    dispatch({ type: 'PHOTO_SELECTED', photoId: target.id })
    // Selection and focus travel together, which is the whole contract of a listbox.
    requestAnimationFrame(() => {
      sheetRef.current?.querySelector<HTMLElement>(`[data-photo="${target.id}"]`)?.focus()
    })
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key
    const step =
      key === 'ArrowRight'
        ? 1
        : key === 'ArrowLeft'
          ? -1
          : key === 'ArrowDown'
            ? COLUMNS
            : key === 'ArrowUp'
              ? -COLUMNS
              : 0
    if (step !== 0) {
      event.preventDefault()
      move(index + step)
      return
    }
    if (key === 'Home') {
      event.preventDefault()
      move(0)
    } else if (key === 'End') {
      event.preventDefault()
      move(photos.length - 1)
    }
  }

  return (
    <>
      <div
        className="nova-photos__sheet"
        ref={sheetRef}
        role="listbox"
        aria-label="Extracted photographs"
        onKeyDown={onKeyDown}
      >
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            role="option"
            data-photo={photo.id}
            className="nova-photos__tile"
            aria-selected={photo.selected}
            tabIndex={photo.selected ? 0 : -1}
            onClick={() => dispatch({ type: 'PHOTO_SELECTED', photoId: photo.id })}
            onKeyDown={quickLook({ kind: 'photo', id: photo.id })}
          >
            <span className="nova-photos__thumb">
              <PhotoFrame subject={photo.subject} label={photo.label} />
            </span>
            <span className="nova-photos__name">{photo.label}</span>
          </button>
        ))}
      </div>

      <div className="nova-photos__viewer">
        {open ? (
          <>
            <div className="nova-photos__stage">
              <PhotoFrame subject={open.subject} label={open.label} />
            </div>
            <div className="nova-photos__caption">
              <span className="nova-photos__label">{open.label}</span>
              <span className="nova-photos__source">{open.source}</span>
            </div>
            <ul className="nova-photos__exif">
              <li>{open.meta}</li>
              {open.detail.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {open.evidenceId ? (
              <div className="nova-photos__pin">
                <PinButton evidenceId={open.evidenceId} via="device" />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}

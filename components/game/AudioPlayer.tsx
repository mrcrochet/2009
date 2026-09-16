'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioDoc } from '@/engine/case-schema'
import { cueIndexAt, timecode, waveform } from '@/engine/documents'
import { playPhrase } from '@/lib/audio'

/**
 * A recording, played the way a forensic tool plays one.
 *
 * Two rules hold it honest. **The transcript is legible without pressing anything** — a document
 * a player cannot read because the sound is off is a document the case did not really give
 * them. And **nothing here is a media file**: the waveform is derived from the recording's id,
 * the voice is a shape made at runtime, and what the player is actually working from is the
 * timed text. Press play to hear a man leaving a voicemail; read it either way.
 *
 * Mounted with the recording's id as its key, so a new recording is a new transport rather than
 * an old one carrying its playhead into a file it does not belong to.
 */
export function AudioPlayer({ id, audio }: { id: string; audio: AudioDoc }) {
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const bars = useMemo(() => waveform(id), [id])
  const spoken = useRef(-1)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - last) / 1000
      last = now
      setPosition((current) => {
        const next = current + elapsed
        if (next >= audio.durationSec) {
          setPlaying(false)
          return audio.durationSec
        }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, audio.durationSec])

  const current = cueIndexAt(audio.cues, position)

  // One phrase per line as it comes round, and only while the transport is actually running.
  useEffect(() => {
    if (!playing) {
      spoken.current = current
      return
    }
    if (current < 0 || current === spoken.current) return
    spoken.current = current
    const cue = audio.cues[current]
    if (!cue || !cue.who) return
    const next = audio.cues[current + 1]
    playPhrase(cue.text, (next ? next.at : audio.durationSec) - cue.at)
  }, [current, playing, audio])

  const seek = useCallback(
    (to: number) => {
      const clamped = Math.min(audio.durationSec, Math.max(0, to))
      setPosition(clamped)
      spoken.current = cueIndexAt(audio.cues, clamped)
    },
    [audio],
  )

  const played = position / audio.durationSec

  return (
    <div className="nova-rec">
      <div className="nova-rec__transport">
        <button
          type="button"
          className="nova-rec__play"
          data-playing={playing}
          aria-label={playing ? 'Pause the recording' : 'Play the recording'}
          onClick={() => {
            if (position >= audio.durationSec) seek(0)
            setPlaying((p) => !p)
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            {playing ? (
              <g fill="currentColor">
                <rect x="3.5" y="2.5" width="3.4" height="11" />
                <rect x="9.1" y="2.5" width="3.4" height="11" />
              </g>
            ) : (
              <path d="M4 2.4L13.4 8 4 13.6Z" fill="currentColor" />
            )}
          </svg>
        </button>

        <div className="nova-rec__wave">
          <div className="nova-rec__bars" aria-hidden="true">
            {bars.map((height, i) => (
              <span
                key={i}
                className="nova-rec__bar"
                data-played={i / bars.length <= played}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            className="nova-rec__scrub"
            min={0}
            max={audio.durationSec}
            step={0.1}
            value={position}
            aria-label="Position in the recording"
            aria-valuetext={`${timecode(position)} of ${timecode(audio.durationSec)}`}
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>

        <span className="nova-rec__time">
          {timecode(position)} / {timecode(audio.durationSec)}
        </span>
      </div>

      <div className="nova-rec__channel">{audio.channel}</div>

      <ol className="nova-rec__transcript">
        {audio.cues.map((cue, i) => (
          <li key={i}>
            <button
              type="button"
              className="nova-rec__cue"
              data-current={i === current}
              data-silent={cue.who === ''}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => seek(cue.at)}
            >
              <span className="nova-rec__at">{timecode(cue.at)}</span>
              {cue.who ? <span className="nova-rec__who">{cue.who}</span> : null}
              <span className="nova-rec__said">{cue.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

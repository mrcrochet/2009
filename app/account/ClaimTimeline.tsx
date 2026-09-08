'use client'

import { useEffect, useState } from 'react'
import { track } from '@/lib/analytics'
import { loadTimeline } from '@/lib/persistence/local-store'
import { toStored } from '@/lib/persistence/types'
import styles from './account.module.css'

type Status = 'idle' | 'working' | 'done' | 'missing' | 'error'

/**
 * Moves a guest timeline out of IndexedDB and onto the account, once. After this the server owns
 * it. Every state change happens in a promise callback, never synchronously inside the effect.
 */
export function ClaimTimeline({ timelineId }: { timelineId: string | null }) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<Status>(timelineId ? 'working' : 'idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!timelineId) return
    let cancelled = false

    loadTimeline(timelineId)
      .then((local) => {
        if (cancelled) return null
        if (!local) {
          setStatus('missing')
          return null
        }
        return fetch(`/api/timelines/${encodeURIComponent(timelineId)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ timeline: toStored(local) }),
        })
      })
      .then(async (response) => {
        if (cancelled || !response) return
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          setMessage(data.error ?? 'could not save the timeline')
          setStatus('error')
          return
        }
        track('signup_completed', { claimedTimeline: true })
        setStatus('done')
      })
      .catch(() => {
        if (cancelled) return
        setMessage('the network refused')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [timelineId, attempt])

  if (!timelineId) return null

  return (
    <section className={styles.card}>
      <div className={styles.cardTitle}>Your Day 01</div>
      <div className={styles.mono}>
        {status === 'working' ? 'Moving your timeline to this account…' : null}
        {status === 'done' ? 'Saved. This timeline now follows your account.' : null}
        {status === 'missing'
          ? 'That timeline is not in this browser. Open it on the device you played it on.'
          : null}
        {status === 'error' ? `Could not save: ${message}` : null}
        {status === 'idle' ? 'Nothing to claim.' : null}
      </div>
      {status === 'error' ? (
        <div className={styles.row}>
          <button
            type="button"
            className="hal-cta hal-cta--ghost"
            onClick={() => {
              setStatus('working')
              setMessage(null)
              setAttempt((n) => n + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : null}
    </section>
  )
}

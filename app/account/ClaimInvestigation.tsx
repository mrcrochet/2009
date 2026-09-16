'use client'

import { useEffect, useState } from 'react'
import { track } from '@/lib/analytics'
import { loadInvestigation } from '@/lib/persistence/local-store'
import { toStored } from '@/lib/persistence/types'
import styles from './account.module.css'

type Status = 'idle' | 'working' | 'done' | 'missing' | 'error'

/**
 * Moves a guest investigation out of IndexedDB and onto the account, once. After this the server owns
 * it. Every state change happens in a promise callback, never synchronously inside the effect.
 */
export function ClaimInvestigation({ investigationId }: { investigationId: string | null }) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<Status>(investigationId ? 'working' : 'idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!investigationId) return
    let cancelled = false

    loadInvestigation(investigationId)
      .then((local) => {
        if (cancelled) return null
        if (!local) {
          setStatus('missing')
          return null
        }
        return fetch(`/api/investigations/${encodeURIComponent(investigationId)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ investigation: toStored(local) }),
        })
      })
      .then(async (response) => {
        if (cancelled || !response) return
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          setMessage(data.error ?? 'could not save the investigation')
          setStatus('error')
          return
        }
        track('signup_completed', { claimedInvestigation: true })
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
  }, [investigationId, attempt])

  if (!investigationId) return null

  return (
    <section className={styles.card}>
      <div className={styles.cardTitle}>The case you just worked</div>
      <div className={styles.mono}>
        {status === 'working' ? 'Moving your investigation to this account…' : null}
        {status === 'done' ? 'Saved. This investigation now follows your account.' : null}
        {status === 'missing'
          ? 'That investigation is not in this browser. Open it on the device you played it on.'
          : null}
        {status === 'error' ? `Could not save: ${message}` : null}
      </div>
      {status === 'error' ? (
        <div className={styles.row}>
          <button
            type="button"
            className="nova-cta nova-cta--ghost"
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

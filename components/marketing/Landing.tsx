'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import { lastInvestigationId } from '@/lib/persistence/last-investigation'
import styles from './Landing.module.css'

const noSubscribe = () => () => {}

/**
 * A light route: no engine, no workstation stylesheet, no game bundle. Opening the case is the
 * last time the player sees ordinary website chrome.
 */
export function Landing() {
  const router = useRouter()
  const resumeId = useSyncExternalStore(
    noSubscribe,
    useCallback(() => lastInvestigationId(), []),
    () => null,
  )

  useEffect(() => {
    track('landing_viewed', {})
    router.prefetch('/play')
  }, [router])

  return (
    <main className={styles.root}>
      <div className={styles.top}>
        <span>UNLISTED</span>
        <span>Case 001</span>
      </div>

      <div className={styles.middle}>
        <h1 className={styles.headline}>
          HE NEVER
          <br />
          CAME HOME.
          <br />
          <span>
            THE POLICE
            <br />
            ARE NOT LOOKING.
          </span>
        </h1>

        <div className={styles.facts}>
          <span>A laptop image, a locked handset, and a sister who does not believe them.</span>
          <span>One evening at the workstation.</span>
          <span className={styles.last}>Where do you look first?</span>
        </div>

        <div className={styles.actions}>
          <Link
            href="/play"
            className={styles.wake}
            prefetch
            onClick={() => track('case_opened', { caseId: 'case001' })}
          >
            OPEN THE CASE
          </Link>
          <span className={styles.note}>No account. It starts immediately.</span>
          {resumeId ? (
            <button
              type="button"
              className={styles.resume}
              onClick={() => router.push(`/play/${resumeId}`)}
            >
              resume your investigation
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.foot}>CASE 24-118 · 17 JUN 2026 · PORTLAND, OR</div>
    </main>
  )
}

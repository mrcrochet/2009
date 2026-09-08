'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import { lastTimelineId } from '@/lib/persistence/last-timeline'
import styles from './Landing.module.css'

const noSubscribe = () => () => {}

/**
 * A light route: no engine, no HALCYON stylesheet, no game bundle. Pressing WAKE UP is the last
 * time the player sees ordinary website chrome.
 */
export function Landing() {
  const router = useRouter()
  const resumeId = useSyncExternalStore(
    noSubscribe,
    useCallback(() => lastTimelineId(), []),
    () => null,
  )

  useEffect(() => {
    track('landing_viewed', {})
    router.prefetch('/play')
  }, [router])

  return (
    <main className={styles.root}>
      <div className={styles.top}>
        <span>2009</span>
        <span>An interactive record</span>
      </div>

      <div className={styles.middle}>
        <h1 className={styles.headline}>
          YOU WAKE UP
          <br />
          IN 2009.
          <br />
          <span>
            YOU REMEMBER
            <br />
            EVERYTHING.
          </span>
        </h1>

        <div className={styles.facts}>
          <span>$437.82 in an account that is not yours.</span>
          <span>30 days.</span>
          <span className={styles.last}>What do you do first?</span>
        </div>

        <div className={styles.actions}>
          <Link
            href="/play"
            className={styles.wake}
            prefetch
            onClick={() => track('wake_clicked', {})}
          >
            WAKE UP
          </Link>
          <span className={styles.note}>No account. It starts immediately.</span>
          {resumeId ? (
            <button
              type="button"
              className={styles.resume}
              onClick={() => router.push(`/play/${resumeId}`)}
            >
              resume your timeline
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.foot}>15 JAN 2009 · 07:32 · PORTLAND, OR</div>
    </main>
  )
}

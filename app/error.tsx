'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reportError } from '@/lib/errors'
import styles from './shell.module.css'

/**
 * The route-level fault page. Deliberately *not* in character — a crash is not something HALCYON
 * did, and dressing a real failure up as fiction would leave the player unsure whether their
 * timeline is safe. It says so plainly instead.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { scope: 'route', digest: error.digest })
  }, [error])

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>2009 · fault</div>
        <h1 className={styles.title}>This page stopped.</h1>
        <p className={styles.body}>
          Your timeline is saved in this browser and was not affected. Try again, and if it keeps
          happening the reference below will tell us where to look.
        </p>
        <div className={styles.row}>
          <button type="button" className="hal-cta" onClick={reset}>
            TRY AGAIN
          </button>
          <Link className="hal-cta hal-cta--ghost" href="/">
            Back to the start
          </Link>
        </div>
        {error.digest ? <div className={styles.detail}>reference: {error.digest}</div> : null}
      </div>
    </main>
  )
}

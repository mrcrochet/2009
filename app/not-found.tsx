import Link from 'next/link'
import styles from './shell.module.css'

export const metadata = { title: 'Not found — UNLISTED' }

export default function NotFound() {
  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>unlisted</div>
        <h1 className={styles.title}>There is nothing at this address.</h1>
        <p className={styles.body}>
          The page you were looking for either moved or never existed. Inside a case that would be a
          finding; out here it is a dead link.
        </p>
        <div className={styles.row}>
          <Link className="nova-cta" href="/">
            BACK TO THE START
          </Link>
          <Link className="nova-cta nova-cta--ghost" href="/play">
            Open the case
          </Link>
        </div>
      </div>
    </main>
  )
}

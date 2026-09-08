import Link from 'next/link'
import styles from './shell.module.css'

export const metadata = { title: 'Not found — 2009' }

export default function NotFound() {
  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>2009</div>
        <h1 className={styles.title}>There is nothing at this address.</h1>
        <p className={styles.body}>
          Not in this year and not in ours. The page you were looking for either moved or never
          existed.
        </p>
        <div className={styles.row}>
          <Link className="hal-cta" href="/">
            BACK TO THE START
          </Link>
          <Link className="hal-cta hal-cta--ghost" href="/play">
            Wake up
          </Link>
        </div>
      </div>
    </main>
  )
}

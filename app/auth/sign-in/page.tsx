import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { SignInForm } from './SignInForm'
import styles from '../../account/account.module.css'

export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>
}) {
  const { claim } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(`/account${claim ? `?claim=${encodeURIComponent(claim)}` : ''}`)

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>unlisted · save your investigation</div>
        <h1 className={styles.title}>One link, no password.</h1>
        <p className={styles.body}>
          We send a sign-in link. Nothing about the case you have been working leaves this browser
          until you follow it — and Case 001 stays free whether you sign in or not.
        </p>
        {isSupabaseConfigured() ? (
          <SignInForm claim={claim ?? null} />
        ) : (
          <section className={styles.card}>
            <div className={styles.cardTitle}>Accounts are not configured here</div>
            <div className={styles.mono}>
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud saves.
              Your investigation is already saved in this browser.
            </div>
          </section>
        )}
        <Link className={styles.back} href="/">
          ← back
        </Link>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { getServerEntitlement } from '@/lib/billing/entitlement'
import { getCurrentUser } from '@/lib/supabase/server'
import styles from '../../account/account.module.css'

export const dynamic = 'force-dynamic'

/**
 * Stripe returns here. The webhook is the source of truth, so this page reports what the
 * database already knows rather than trusting the redirect.
 */
export default async function BillingSuccess({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>
}) {
  const { claim } = await searchParams
  const user = await getCurrentUser()
  const entitlement = await getServerEntitlement(user?.id ?? null)

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>2009 · billing</div>
        <h1 className={styles.title}>
          {entitlement.active ? 'Day 02 is open.' : 'Almost there.'}
        </h1>
        <p className={styles.body}>
          {entitlement.active
            ? 'Your subscription is active. The 16th of January 2009 is waiting.'
            : 'Stripe has taken the payment; the confirmation is still landing. Refresh in a moment.'}
        </p>
        <div className={styles.row}>
          {entitlement.active && claim ? (
            <Link className="hal-cta" href={`/play/${claim}?day=2`}>
              CONTINUE YOUR TIMELINE
            </Link>
          ) : null}
          <Link className="hal-cta hal-cta--ghost" href="/account">
            Account
          </Link>
        </div>
      </div>
    </main>
  )
}

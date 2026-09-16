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
        <div className={styles.eyebrow}>unlisted · billing</div>
        <h1 className={styles.title}>
          {entitlement.active ? 'Full access is on.' : 'Almost there.'}
        </h1>
        <p className={styles.body}>
          {entitlement.active
            ? 'Your subscription is active. The case you were working is where you left it, and the next one opens the moment it is written.'
            : 'Stripe has taken the payment; the confirmation is still landing. Refresh in a moment.'}
        </p>
        <div className={styles.row}>
          {/*
            A case is selected by name, and there is no second case to send anybody to yet. This
            carried a season position the router stopped understanding at the pivot: it would have
            reopened Case 001 and called it the second one.
          */}
          {entitlement.active && claim ? (
            <Link className="nova-cta" href={`/play/${claim}`}>
              BACK TO YOUR INVESTIGATION
            </Link>
          ) : null}
          <Link className="nova-cta nova-cta--ghost" href="/account">
            Account
          </Link>
        </div>
      </div>
    </main>
  )
}
